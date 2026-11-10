// Hand-authored game costume directions from the 25 original NFT portraits.
// Lower-body designs are athletic extensions of the visible upper-body material.
// Values are visual only: they never alter reach, speed or collision geometry.
const fit=(chest,waist,arm,thigh,calf,sleeve,legwear,boot,sole,metal)=>Object.freeze({chest,waist,arm,thigh,calf,sleeve,legwear,boot,sole,metal});
export const CHARACTER_COSTUMES=Object.freeze({
  chief:fit(41,23,1.27,1.31,1.25,'plate','plate','#34483b','#b8c7a2','#c2b580'),
  bloodbath:fit(39,22,1.27,1.30,1.24,'sinew','sinew','#250b15','#8d302e','#bf5146'),
  optimus:fit(36,20,1.25,1.27,1.24,'ceramic','ceramic','#d7ecea','#253c48','#72f0ff'),
  quarterback:fit(42,24,1.29,1.31,1.24,'gridiron','plate','#253943','#de6751','#bdcbd0'),
  arachnia:fit(36,21,1.24,1.29,1.21,'carbon','carbon','#151921','#a3433c','#b15c49'),
  elemental:fit(37,21,1.25,1.28,1.22,'porcelain','porcelain','#26627d','#e4d9b4','#d8b568'),
  chaos:fit(38,22,1.23,1.28,1.20,'tailored','pinstripe','#3c2054','#9c6fc2','#83c67c'),
  poison:fit(38,21,1.28,1.31,1.22,'sinew','sinew','#0c171d','#cad7c4','#dae2cf'),
  sheikh:fit(39,23,1.23,1.27,1.21,'robe','robe','#b8ae92','#765f40','#d9bc73'),
  'hockey-mask':fit(41,24,1.26,1.30,1.23,'jacket','denim','#222834','#b1b6ac','#7e8b96'),
  gladiator:fit(42,24,1.28,1.32,1.28,'bronze','greaves','#343b3e','#baa16f','#bba26c'),
  medusa:fit(36,20,1.25,1.29,1.23,'scales','scales','#20362d','#9c9962','#cfc187'),
  'gold-mage':fit(40,23,1.25,1.28,1.22,'gilded','robe','#73432d','#c4a451','#cba858'),
  ice:fit(38,22,1.24,1.29,1.24,'frost','greaves','#214768','#d2eff5','#88d6ec'),
  steampunk:fit(39,23,1.24,1.28,1.23,'clockwork','tailored','#493b2d','#b8a077','#bc9d5b'),
  assimilator:fit(40,23,1.28,1.30,1.26,'machine','plate','#283752','#8ca5bf','#b1bfd3'),
  fire:fit(39,23,1.25,1.29,1.24,'scorched','greaves','#492d23','#c58b55','#b68d59'),
  hunter:fit(41,24,1.29,1.32,1.25,'hunter','plate','#253d34','#8eaa83','#b5b58a'),
  cowboy:fit(39,23,1.24,1.29,1.22,'poncho','denim','#544e3c','#c4b38a','#a99c70'),
  blue:fit(37,21,1.24,1.28,1.23,'woven','woven','#245064','#84cfd0','#b49b6a'),
  alien:fit(38,22,1.23,1.26,1.22,'alien','sinew','#29362e','#afb38b','#b6a69b'),
  'digital-punk':fit(38,22,1.25,1.28,1.22,'punk','denim','#1b302d','#55d7a2','#ca74b4'),
  manga:fit(39,22,1.24,1.28,1.23,'ink','robe','#39373f','#e0dce0','#b5b1bb'),
  mask:fit(40,23,1.27,1.30,1.24,'coat','tailored','#3c322c','#a89d83','#8cc6bd'),
  neural:fit(38,22,1.24,1.28,1.23,'neon','carbon','#252344','#9176e5','#70daee'),
});
export const getCharacterCostume=id=>CHARACTER_COSTUMES[id]||CHARACTER_COSTUMES.chief;
