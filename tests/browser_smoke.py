"""Run against npm start using the environment's Python Playwright and Chromium."""
import os
import struct
import zlib
from playwright.sync_api import sync_playwright

BASE = os.environ.get('PORTFOLIO_TEST_URL', 'http://127.0.0.1:8000')

def png(width, height):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    rows = (b'\x00' + b'\x80\xa0\x80' * width) * height
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    assert page.goto(BASE).status == 200
    assert page.locator('#featured-projects .project-card').count() == 2
    page.locator('[data-case="core"]').first.click()
    assert page.locator('#case-dialog').is_visible()
    assert '144' in page.locator('#case-body').inner_text()
    page.keyboard.press('Escape')
    assert not page.locator('#case-dialog').is_visible()
    page.goto(BASE + '/#projects')
    assert page.locator('#project-grid .project-card').count() == 6
    page.locator('[data-filter="operations"]').click()
    assert page.locator('#project-grid .project-card').count() == 2
    page.locator('[data-case="release"]').click()
    page.locator('[data-close-dialog]').click()
    page.locator('#panel-release').wait_for(state='visible')
    assert '40%' in page.locator('#release-summary').inner_text()
    page.locator('[data-release="handoff"]').check()
    assert '40%' in page.locator('#release-summary').inner_text()
    page.locator('[data-release="validation"]').check()
    page.locator('[data-release="review"]').check()
    assert '100%' in page.locator('#release-summary').inner_text()
    page.locator('[data-release="assets"]').uncheck()
    assert '20%' in page.locator('#release-summary').inner_text()
    page.locator('#tab-checker').click()
    page.locator('#sample').click()
    page.get_by_role('button', name='运行检查').click()
    page.wait_for_function("document.querySelectorAll('#report .fail').length === 2")
    assert page.locator('#report .skip').count() == 1
    page.locator('#copy').fill('Hello')
    page.locator('#languages').fill('en_US, zh-cn, JA_jp')
    page.locator('#image').set_input_files({'name': 'valid.png', 'mimeType': 'image/png', 'buffer': png(800, 450)})
    page.get_by_role('button', name='运行检查').click()
    page.wait_for_function("document.querySelectorAll('#report .pass').length === 3")
    page.locator('#image').set_input_files({'name': 'small.png', 'mimeType': 'image/png', 'buffer': png(100, 100)})
    page.get_by_role('button', name='运行检查').click()
    page.wait_for_function("document.querySelectorAll('#report .fail').length === 1")
    page.locator('#image').set_input_files({'name': 'broken.png', 'mimeType': 'image/png', 'buffer': b'invalid'})
    page.get_by_role('button', name='运行检查').click()
    page.wait_for_function("document.querySelector('#report').textContent.includes('无法读取图片')")
    page.locator('#tab-mail').click()
    assert page.locator('.mail-item').count() == 5
    page.locator('[data-mail-filter="P0"]').click()
    assert page.locator('.mail-item').count() == 2
    page.locator('[data-handle-mail="1"]').click()
    assert page.locator('[data-handle-mail="1"]').get_attribute('aria-pressed') == 'true'
    page.locator('#reset-mail').click()
    assert page.locator('.mail-item').count() == 5
    page.goto(BASE + '/#growth')
    page.locator('[data-task="position"]').check()
    page.locator('#reflection').fill('I practiced explaining validation. <script>throw new Error()</script>')
    page.reload()
    assert page.locator('[data-task="position"]').is_checked()
    assert 'I practiced' in page.locator('#reflection').input_value()
    page.locator('#scenario').select_option('risk')
    assert 'The main risk is' in page.locator('#phrase-list').inner_text()
    page.clock.install()
    page.locator('#timer-start').click()
    page.clock.fast_forward(2000)
    assert page.locator('#timer-display').inner_text() == '00:58'
    page.locator('#timer-start').click()
    page.clock.fast_forward(3000)
    assert page.locator('#timer-display').inner_text() == '00:58'
    page.locator('#timer-reset').click()
    assert page.locator('#timer-display').inner_text() == '01:00'
    page.locator('#timer-start').click()
    page.clock.fast_forward(60000)
    assert page.locator('#timer-display').inner_text() == '00:00'
    with page.expect_download() as info:
        page.locator('#export-notes').click()
    assert info.value.suggested_filename.endswith('.md')
    page.on('dialog', lambda dialog: dialog.accept())
    page.locator('#reset-progress').click()
    assert not page.locator('[data-task="position"]').is_checked()
    assert 'I practiced' in page.locator('#reflection').input_value()
    # UI translation and no-overflow checks across common screen sizes.
    for language in ['en', 'zh']:
        page.locator('#language').click()
        assert page.locator('html').get_attribute('lang') == ('en' if language == 'en' else 'zh-CN')
        for width in [1440, 1024, 768, 390, 320]:
            page.set_viewport_size({'width': width, 'height': 900})
            for route in ['overview', 'projects', 'lab', 'growth']:
                page.goto(BASE + '/#' + route)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (language, width, route)
    # Storage denial should not make the site unusable or misreport a save.
    denied = browser.new_context(reduced_motion='reduce')
    denied.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } });")
    denied_page = denied.new_page()
    denied_page.goto(BASE + '/#growth')
    denied_page.locator('#reflection').fill('Temporary note')
    assert '无法保存' in denied_page.locator('#save-status').inner_text()
    denied.close()
    assert not errors, errors
    print('PASS: case dialogs, filters, 3 demos, dependencies, persistence, timer, export, bilingual routes, 5 viewport widths, storage denial, no JS errors.')
    browser.close()
