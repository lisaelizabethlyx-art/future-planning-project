export function classifyMail(subject) {
  if (/deadline|截止/i.test(subject)) return 'P0';
  if (/review|审核/i.test(subject)) return 'P1';
  return 'P2';
}
export const releaseSteps = [
  { id:'scope', deps:[], title:['确认范围与负责人','Confirm scope & owners'], detail:['明确交付内容、语言和目标日期。','Agree on content, languages, and target dates.'] },
  { id:'assets', deps:['scope'], title:['准备素材与多语言文案','Prepare assets & localized copy'], detail:['形成可交接的内容包。','Prepare a content package for handoff.'] },
  { id:'validation', deps:['assets'], title:['完成交付前检查','Complete pre-handoff checks'], detail:['确认内容包满足本次约定的要求。','Check the package against the agreed requirements.'] },
  { id:'review', deps:['validation'], title:['完成模拟评审','Complete the simulated review'], detail:['记录反馈与未解决事项。','Record feedback and outstanding items.'] },
  { id:'handoff', deps:['review'], title:['确认最终交付','Confirm the final handoff'], detail:['核对依赖、责任人与后续支持。','Verify dependencies, ownership, and support.'] }
];
export function releaseReadiness(completed) {
  const states = {};
  for (const step of releaseSteps) {
    const blocked = step.deps.some(id => states[id] !== 'done');
    states[step.id] = blocked ? 'blocked' : completed.has(step.id) ? 'done' : 'pending';
  }
  const done = Object.values(states).filter(state => state === 'done').length;
  return { states, done, percent: Math.round(done / releaseSteps.length * 100), ready: done === releaseSteps.length };
}
export const mockMails = [
 {id:1,from:'Platform team',initial:'P',subject:'Deadline: asset corrections due Friday',description:['模拟通知：请在约定日期前补齐素材。建议先确认负责人和影响范围。','Synthetic notice: asset corrections are due by the agreed date. Confirm ownership and impact first.'],time:'09:15'},
 {id:2,from:'Review desk',initial:'R',subject:'Review feedback: localized copy',description:['模拟反馈：两种语言的描述需要复核。请记录修改项后安排确认。','Synthetic feedback: descriptions in two languages need review. Record changes and arrange confirmation.'],time:'10:30'},
 {id:3,from:'Publishing digest',initial:'D',subject:'Weekly publishing newsletter',description:['模拟资讯：本周发行与行业信息。可在集中阅读时间处理。','Synthetic digest: weekly publishing and industry news. Suitable for a scheduled reading block.'],time:'11:05'},
 {id:4,from:'Project partner',initial:'O',subject:'截止提醒：确认上线素材交接',description:['模拟通知：需要在今天确认交接范围；此条展示中文关键词命中。','Synthetic notice: confirm handoff scope today. Demonstrates matching a Chinese deadline keyword.'],time:'13:40'},
 {id:5,from:'Studio team',initial:'S',subject:'Team notes: next week’s planning',description:['模拟记录：下周计划与待讨论事项，不含紧急动作。','Synthetic notes: next week’s plans and discussion items, without an urgent action.'],time:'14:20'}
];
