export type ToolId = 'carpet'|'clothing'|'decor'|'ceiling'|'repair'|'window'|'curtain';
export const tools = [
 {id:'carpet',name:'替换地毯',en:'RUG',hint:'按文字要求替换场景中的地毯，保留地面与周围家具。',presets:['米白羊毛','天然黄麻','灰色短绒','复古波斯','几何格纹','低饱和抽象','参考图 / 自定义']},
 {id:'clothing',name:'模特换装',en:'WARDROBE',hint:'只修改衣服，保留人物身份、动作与皮肤。',presets:['上衣','下装','全身衣服']},
 {id:'decor',name:'替换软装',en:'STYLING',hint:'按文字要求替换对应软装，避免改变主产品。',presets:['抱枕','装饰画','灯具','绿植','花瓶 / 摆件','床品','参考图 / 自定义']},
 {id:'ceiling',name:'修补天花板',en:'CEILING',hint:'按文字要求修补或更换天花板，匹配空间透视。',presets:['匹配原有天花板','平整石膏顶','原木平板顶','胡桃木平板顶','木格栅顶','浅色梁式顶','简约叠级顶','工业裸顶']},
 {id:'repair',name:'场景瑕疵修补',en:'RETOUCH',hint:'用周围的材质和纹理自然修补。',presets:['自然修补']},
 {id:'window',name:'替换窗外景',en:'VIEW',hint:'只替换玻璃后的窗外，不修改窗框、室内与光线。',presets:['城市天际线','城市公园','乡村田野','庭院花园','远山湖泊','海边景色','林间绿意','AI 匹配环境','参考图 / 自定义']},
 {id:'curtain',name:'替换窗帘',en:'DRAPERY',hint:'保留窗户位置与原有日光，只改窗帘。',presets:['轻透白纱','米白亚麻','浅灰棉麻','深色遮光帘','柔软丝绒','罗马帘','木质百叶帘','纱帘 + 布帘','参考图 / 自定义']},
] as const;
export const repairOptions = ['孔洞 / 缺口','电线穿帮','地板污渍 / 杂物','墙面瑕疵','接缝 / 破损','其他局部瑕疵'];
export type Point = {x:number;y:number};
export type Shape = {id:string;kind:'brush'|'rect';points:Point[];width:number};
export type Draft = {enabled:boolean;preset:string;detail:string;fit:string;repairs:string[];blur:string;color:string;shapes:Shape[];reference:string;referenceName:string};
export function initialDrafts():Record<ToolId,Draft> {
 return Object.fromEntries(tools.map((t,i)=>[t.id,{enabled:i===0,preset:t.presets[0],detail:'',fit:'AI 适应',repairs:[],blur:'轻微虚化',color:'保留原色',shapes:[],reference:'',referenceName:''}])) as unknown as Record<ToolId,Draft>;
}
export function instruction(id:ToolId,d:Pick<Draft,'preset'|'detail'|'fit'|'repairs'|'blur'|'color'>) {
 const t=tools.find(x=>x.id===id);if(!t)throw Error('无效的修改工具');
 let s=t.name+'：'+d.preset+'。只修改文字明确指定的对应对象，保持其他场景内容尽量不变。';
 if(id==='clothing')s+='只替换'+d.preset+'；穿着版型：'+d.fit+'。面部、头发、肤色、身体比例、动作与未选中的衣服全部保持不变。';
 if(id==='repair')s+='修补项目：'+d.repairs.join('、')+'。移除瑕疵后以邻近的原有纹理无痕填补，不加入新物品。';
 if(id==='window')s+='窗外景虚化：'+d.blur+'。只改变玻璃后方景色，窗框、百叶、窗帘、玻璃反射与室内全部不变。';
 if(id==='curtain')s+='颜色要求：'+d.color+'。保留窗帘的合理垂坠感与现有光影方向，禁止改变室内曝光。';
 if(id==='carpet')s+='保留原地毯轮廓、尺寸和位置、家具遮挡和接触阴影。';
 if(id==='ceiling')s+='仅对天花板补全对应材质，严格保持建筑透视、顶面高度和现有灯具。';
 if(id==='decor')s+='仅替换对应的软装物品，主产品的造型、比例、颜色与纹理不变。';
 return s+(d.detail?'补充要求：'+d.detail:'');
}
export const invariants='严格按文字要求编辑整张图：只修改明确指定的对象或瑕疵，未指定的场景内容尽量保持不变。保留原始相机视角、构图、画幅、建筑结构与透视。主产品的造型、颜色、材质与细小纹理，及场景原有质感保持不变；禁止全局调色、滤镜、磨皮、锐化、曝光调整。保留原有白平衡、光线方向、亮度、色温、明暗层次、原有投影与反射。编辑物体须自然匹配已有照明。所有未选中的物品和广告文字保持不变，不添加文字、水印或物品。参考图只用于指定替换物的款式、图案、颜色和材质，禁止借用参考图背景、光线或场景。';
