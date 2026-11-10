/**
 * Individually art-directed basketball adaptations of the 25 original 1/1s.
 * Portrait references live in assets/characters/<id>.jpg. The portraits establish
 * helmets, upper-body materials and signature ornaments; the athletic lower
 * bodies and movement are new game artwork, not claims about unseen NFT anatomy.
 *
 * body values scale the shared articulated rig, not the player's gameplay stats.
 * animation stride/bob/idle are motion multipliers; dunkStyle selects a pose arc.
 * details and accessories document the art direction; sprites.js implements the
 * visible signatures in explicit per-character drawing branches.
 */
export const CHARACTER_ART = {
  // Olive beveled plate, raised rectangular shoulders and a gold visor distinguish CHIEF.
  chief: {
    helmet: 'chief', build: 'heavy', silhouette: 'powered-armor', material: 'painted-metal',
    palette: { base: '#829376', shadow: '#465b49', highlight: '#bec8a7', skin: '#33443a', skinShadow: '#1b2c26', visor: '#ffd866', accent: '#ffe497', metal: '#c9bb89' },
    body: { height: 1.02, shoulder: 1.18, limbWidth: 1.15, torsoWidth: 1.12, legLength: 0.98 },
    details: ['beveled-chest', 'raised-pauldrons', 'waist-plating', 'knee-guards'],
    accessories: ['gold-medallion'],
    animation: { stride: 0.91, bob: 0.66, idle: 0.52, dunkStyle: 'power' },
  },
  // BLOODBATH has white eye slashes, crimson sinew and tangled black/red tendrils.
  bloodbath: {
    helmet: 'bloodbath', build: 'power', silhouette: 'sinew', material: 'organic',
    palette: { base: '#55131b', shadow: '#170a0f', highlight: '#ac3e36', skin: '#3f1119', skinShadow: '#11090d', visor: '#e4fbff', accent: '#ff6a51', metal: '#b92339' },
    body: { height: 0.99, shoulder: 1.16, limbWidth: 1.12, torsoWidth: 1.08, legLength: 0.97 },
    details: ['ribbed-tendons', 'claw-fingers', 'split-shin'],
    accessories: ['shoulder-tendrils'],
    animation: { stride: 1.16, bob: 1.18, idle: 1.05, dunkStyle: 'tomahawk' },
  },
  // OPTIMUS is a slender white ceramic android with black joints and a cyan light contour.
  optimus: {
    helmet: 'optimus', build: 'lean', silhouette: 'ceramic', material: 'polished',
    palette: { base: '#d8ece9', shadow: '#87a9b1', highlight: '#f8ffff', skin: '#243e46', skinShadow: '#101f2a', visor: '#35dff7', accent: '#76f5ff', metal: '#b7e5e9' },
    body: { height: 1.06, shoulder: 0.89, limbWidth: 0.86, torsoWidth: 0.88, legLength: 1.08 },
    details: ['smooth-chest', 'black-side-panels', 'segmented-joints'],
    accessories: ['cyan-medallion'],
    animation: { stride: 1.04, bob: 0.44, idle: 0.24, dunkStyle: 'reverse' },
  },
  // QUARTERBACK's silver football pads carry red markings over a ribbed dark undersuit.
  quarterback: {
    helmet: 'quarterback', build: 'heavy', silhouette: 'gridiron', material: 'padded',
    palette: { base: '#8f9fa6', shadow: '#465761', highlight: '#d7e8eb', skin: '#263642', skinShadow: '#14232c', visor: '#ff794f', accent: '#f45142', metal: '#b8cbd0' },
    body: { height: 1.01, shoulder: 1.20, limbWidth: 1.11, torsoWidth: 1.15, legLength: 0.98 },
    details: ['football-pads', 'jersey-panels', 'red-arm-stripes', 'knee-pads'],
    accessories: ['orange-medallion'],
    animation: { stride: 1.03, bob: 0.86, idle: 0.68, dunkStyle: 'power' },
  },
  // ARACHNIA's red geometric webwork and faceted chest gem sit on narrow black armor.
  arachnia: {
    helmet: 'arachnia', build: 'lean', silhouette: 'spider-armor', material: 'carbon',
    palette: { base: '#22222a', shadow: '#0d1118', highlight: '#545258', skin: '#10151e', skinShadow: '#050810', visor: '#ff5866', accent: '#9b3c30', metal: '#a36c50' },
    body: { height: 1.03, shoulder: 0.88, limbWidth: 0.85, torsoWidth: 0.85, legLength: 1.06 },
    details: ['red-web-lattice', 'faceted-chest-gem', 'angled-shoulder-fins', 'pointed-boots'],
    accessories: ['spider-collar'],
    animation: { stride: 1.19, bob: 0.61, idle: 0.41, dunkStyle: 'scissor' },
  },
  // ELEMENTAL combines blue porcelain, branching gold repairs and an ivory shell, with green vines.
  elemental: {
    helmet: 'elemental', build: 'athletic', silhouette: 'kintsugi-shell', material: 'porcelain',
    palette: { base: '#e3dbbb', shadow: '#a4aa99', highlight: '#fff4d8', skin: '#276d8e', skinShadow: '#17354e', visor: '#4de4f7', accent: '#f08b52', metal: '#d9b763' },
    body: { height: 1.04, shoulder: 0.99, limbWidth: 0.94, torsoWidth: 0.97, legLength: 1.03 },
    details: ['blue-porcelain-panels', 'gold-kintsugi', 'ivory-collar'],
    accessories: ['green-vines', 'coral-medallion'],
    animation: { stride: 0.98, bob: 0.72, idle: 0.84, dunkStyle: 'windmill' },
  },
  // CHAOS retains a purple lapelled jacket, green shirt, maroon bow tie and a tiny lapel flower.
  chaos: {
    helmet: 'chaos', build: 'athletic', silhouette: 'tailored-jacket', material: 'fabric',
    palette: { base: '#8e55b2', shadow: '#4b2b65', highlight: '#c28ce0', skin: '#52ad58', skinShadow: '#1c4a37', visor: '#ff5852', accent: '#71ec68', metal: '#d5ded8' },
    body: { height: 1.01, shoulder: 0.97, limbWidth: 0.93, torsoWidth: 0.94, legLength: 1.04 },
    details: ['purple-lapels', 'green-shirt', 'jacket-tails', 'pinstripe-trousers'],
    accessories: ['maroon-bowtie', 'lapel-flower', 'green-medallion'],
    animation: { stride: 1.13, bob: 1.22, idle: 1.19, dunkStyle: 'windmill' },
  },
  // POISON's glossy black tendrils frame a conspicuous ivory spider/rib motif on the chest.
  poison: {
    helmet: 'poison', build: 'lean', silhouette: 'tendril-suit', material: 'organic',
    palette: { base: '#111c20', shadow: '#050b0f', highlight: '#567476', skin: '#0c161a', skinShadow: '#03070b', visor: '#ffa653', accent: '#e8ead7', metal: '#c8c8a4' },
    body: { height: 1.05, shoulder: 0.95, limbWidth: 0.89, torsoWidth: 0.90, legLength: 1.06 },
    details: ['white-rib-emblem', 'glossy-tendons', 'long-claw-hands'],
    accessories: ['curling-tendrils', 'ivory-medallion'],
    animation: { stride: 1.15, bob: 0.77, idle: 1.12, dunkStyle: 'reverse' },
  },
  // SHEIKH's cream woven robe has ornate gold edging and narrow green/red vertical stripes.
  sheikh: {
    helmet: 'sheikh', build: 'athletic', silhouette: 'split-robe', material: 'linen',
    palette: { base: '#d7d1c2', shadow: '#969180', highlight: '#eee7d6', skin: '#c5bfae', skinShadow: '#80796b', visor: '#ffe89f', accent: '#d6ae4e', metal: '#b5a16f' },
    body: { height: 1.04, shoulder: 0.98, limbWidth: 0.94, torsoWidth: 1.01, legLength: 1.02 },
    details: ['gold-robe-trim', 'striped-robe-edges', 'split-robe-panels', 'gold-cuffs'],
    accessories: ['ghutra-drape', 'gold-medallion'],
    animation: { stride: 0.94, bob: 0.53, idle: 0.62, dunkStyle: 'reverse' },
  },
  // HOCKEY MASK uses aged mint perforations and red marks above a weathered indigo zip jacket.
  'hockey-mask': {
    helmet: 'hockey-mask', build: 'power', silhouette: 'work-jacket', material: 'leather',
    palette: { base: '#424a58', shadow: '#252b3e', highlight: '#727789', skin: '#525750', skinShadow: '#222c2b', visor: '#171c25', accent: '#a33448', metal: '#b6c2b0' },
    body: { height: 1.02, shoulder: 1.10, limbWidth: 1.08, torsoWidth: 1.09, legLength: 0.98 },
    details: ['zippered-jacket', 'stitched-pockets', 'turned-collar', 'heavy-boots'],
    accessories: ['shoulder-hilt', 'dark-medallion'],
    animation: { stride: 0.87, bob: 0.58, idle: 0.27, dunkStyle: 'tomahawk' },
  },
  // GLADIATOR's bronze lion breastplate, rectangular shoulder rims and crossed sword hilts are distinct.
  gladiator: {
    helmet: 'gladiator', build: 'power', silhouette: 'bronze-breastplate', material: 'bronze',
    palette: { base: '#464b4d', shadow: '#202831', highlight: '#7e878b', skin: '#2a333b', skinShadow: '#111a23', visor: '#ffab62', accent: '#c0a775', metal: '#a99364' },
    body: { height: 1.03, shoulder: 1.15, limbWidth: 1.10, torsoWidth: 1.12, legLength: 1.00 },
    details: ['lion-breastplate', 'square-shoulder-rims', 'leather-skirt-strips', 'bronze-greaves'],
    accessories: ['crossed-sword-hilts'],
    animation: { stride: 0.96, bob: 0.74, idle: 0.59, dunkStyle: 'power' },
  },
  // MEDUSA's separate pale snake heads coil above green scales and fine golden chest scrollwork.
  medusa: {
    helmet: 'medusa', build: 'lean', silhouette: 'serpent-scale', material: 'scales',
    palette: { base: '#263834', shadow: '#101d1c', highlight: '#6e8776', skin: '#233c37', skinShadow: '#102522', visor: '#4de6f4', accent: '#c9b770', metal: '#e0cc87' },
    body: { height: 1.03, shoulder: 0.91, limbWidth: 0.90, torsoWidth: 0.89, legLength: 1.06 },
    details: ['overlapping-scales', 'gold-scrollwork', 'serpent-belt'],
    accessories: ['living-snake-crown', 'shoulder-snakes', 'green-medallion'],
    animation: { stride: 1.02, bob: 0.48, idle: 1.27, dunkStyle: 'scissor' },
  },
  // GOLD MAGE has actual upward gold horns, dragon shoulders, teal jewels and a rust-red robe.
  'gold-mage': {
    helmet: 'gold-mage', build: 'athletic', silhouette: 'dragon-regalia', material: 'fabric',
    palette: { base: '#8b4938', shadow: '#40282b', highlight: '#be7654', skin: '#663a30', skinShadow: '#30242a', visor: '#6ae5ed', accent: '#53d8bd', metal: '#c7a355' },
    body: { height: 1.06, shoulder: 1.08, limbWidth: 0.97, torsoWidth: 0.98, legLength: 1.04 },
    details: ['dragon-pauldrons', 'gold-scrollwork', 'red-robe-panels', 'gold-bracers'],
    accessories: ['horned-crown', 'teal-gems', 'dragon-staff'],
    animation: { stride: 0.92, bob: 0.62, idle: 0.79, dunkStyle: 'windmill' },
  },
  // ICE's navy hood frames a silver skeletal jaw; blue crossing straps and frosted spikes stay visible.
  ice: {
    helmet: 'ice', build: 'athletic', silhouette: 'frost-harness', material: 'frost',
    palette: { base: '#213b5c', shadow: '#101c30', highlight: '#7198b7', skin: '#1b273e', skinShadow: '#090e1b', visor: '#72e5ff', accent: '#a6edff', metal: '#d0e8ec' },
    body: { height: 1.02, shoulder: 1.02, limbWidth: 0.98, torsoWidth: 0.97, legLength: 1.03 },
    details: ['crossed-blue-straps', 'frosted-pauldrons', 'silver-rivets', 'ice-greaves'],
    accessories: ['navy-hood', 'ice-spikes', 'silver-medallion'],
    animation: { stride: 1.01, bob: 0.57, idle: 0.38, dunkStyle: 'reverse' },
  },
  // STEAMPUNK's goggles, brass machinery and pale coat piping surround a small burgundy bow tie.
  steampunk: {
    helmet: 'steampunk', build: 'athletic', silhouette: 'clockwork-coat', material: 'brass',
    palette: { base: '#514b3c', shadow: '#2d2a28', highlight: '#877759', skin: '#715b3d', skinShadow: '#3a3029', visor: '#f0d09e', accent: '#d9ab5c', metal: '#b99655' },
    body: { height: 0.98, shoulder: 1.01, limbWidth: 1.00, torsoWidth: 1.04, legLength: 0.97 },
    details: ['piped-frock-coat', 'brass-gears', 'mechanical-elbows', 'spatted-boots'],
    accessories: ['forehead-goggles', 'burgundy-bowtie', 'copper-medallion', 'shoulder-pistons'],
    animation: { stride: 0.89, bob: 0.93, idle: 0.73, dunkStyle: 'tomahawk' },
  },
  // ASSIMILATOR is asymmetric: one blue optical implant, navy tactical plates and looping ribbed cables.
  assimilator: {
    helmet: 'assimilator', build: 'heavy', silhouette: 'cyborg-harness', material: 'cybernetic',
    palette: { base: '#52637e', shadow: '#2e3a54', highlight: '#8b9cb4', skin: '#303c54', skinShadow: '#172235', visor: '#8e9dff', accent: '#637cff', metal: '#98a8c3' },
    body: { height: 1.00, shoulder: 1.09, limbWidth: 1.04, torsoWidth: 1.10, legLength: 0.99 },
    details: ['asymmetric-chest-plate', 'ribbed-tubes', 'reinforced-left-arm', 'tactical-knee-guards'],
    accessories: ['navy-hood', 'shoulder-cables', 'blue-medallion'],
    animation: { stride: 0.86, bob: 0.46, idle: 0.32, dunkStyle: 'power' },
  },
  // FIRE's brown hood and bronze jaw sit over orange crossing straps, thorned shoulders and barbed wire.
  fire: {
    helmet: 'fire', build: 'power', silhouette: 'thorn-harness', material: 'scorched-metal',
    palette: { base: '#4a302b', shadow: '#211f23', highlight: '#855741', skin: '#342c2c', skinShadow: '#15191f', visor: '#ffb55a', accent: '#d59655', metal: '#988a77' },
    body: { height: 1.02, shoulder: 1.08, limbWidth: 1.06, torsoWidth: 1.06, legLength: 1.00 },
    details: ['crossed-orange-straps', 'thorn-pauldrons', 'copper-rivets', 'charred-greaves'],
    accessories: ['brown-hood', 'barbed-wire', 'orange-medallion'],
    animation: { stride: 1.07, bob: 0.96, idle: 0.96, dunkStyle: 'tomahawk' },
  },
  // HUNTER carries black cable dreadlocks, small ivory skull trophies and twin high shoulder blades.
  hunter: {
    helmet: 'hunter', build: 'power', silhouette: 'trophy-armor', material: 'bronze',
    palette: { base: '#3e5149', shadow: '#172f2d', highlight: '#849278', skin: '#243c36', skinShadow: '#101e21', visor: '#a2e64f', accent: '#7ba14e', metal: '#9f8458' },
    body: { height: 1.05, shoulder: 1.13, limbWidth: 1.07, torsoWidth: 1.05, legLength: 1.04 },
    details: ['layered-pauldrons', 'trophy-harness', 'segmented-shins', 'claw-fingers'],
    accessories: ['cable-dreadlocks', 'skull-trophies', 'twin-shoulder-blades', 'jade-medallion'],
    animation: { stride: 1.10, bob: 0.81, idle: 0.67, dunkStyle: 'scissor' },
  },
  // COWBOY's broad brim and cream scarf pair with a cartridge bandolier and bright turquoise rope.
  cowboy: {
    helmet: 'cowboy', build: 'athletic', silhouette: 'western-duster', material: 'leather',
    palette: { base: '#74776f', shadow: '#3b4441', highlight: '#b5b4a9', skin: '#555b53', skinShadow: '#242c2a', visor: '#f3d3a5', accent: '#49c8ce', metal: '#8b7d60' },
    body: { height: 1.03, shoulder: 1.00, limbWidth: 0.98, torsoWidth: 0.98, legLength: 1.05 },
    details: ['split-duster', 'weathered-seams', 'cartridge-bandolier', 'western-boots'],
    accessories: ['wide-brim-hat', 'cream-scarf', 'turquoise-rope', 'gold-medallion'],
    animation: { stride: 1.00, bob: 0.88, idle: 0.87, dunkStyle: 'windmill' },
  },
  // BLUE has an organic blue neck, purple ear fins, long braids and a woven diagonal harness.
  blue: {
    helmet: 'blue', build: 'lean', silhouette: 'woven-harness', material: 'woven',
    palette: { base: '#62685c', shadow: '#333f3d', highlight: '#a29f8c', skin: '#296478', skinShadow: '#173f50', visor: '#44eaf4', accent: '#9b78db', metal: '#8c8b70' },
    body: { height: 1.07, shoulder: 0.87, limbWidth: 0.87, torsoWidth: 0.87, legLength: 1.08 },
    details: ['woven-cross-harness', 'blue-skin-panels', 'braided-wrist-wraps', 'soft-wrap-boots'],
    accessories: ['long-braids', 'purple-ear-fins', 'pale-medallion'],
    animation: { stride: 1.20, bob: 1.08, idle: 0.91, dunkStyle: 'scissor' },
  },
  // ALIEN's pale elongated dome has large dark eye panels above a black tube-laced suit and pale studs.
  alien: {
    helmet: 'alien', build: 'lean', silhouette: 'insectoid-suit', material: 'organic',
    palette: { base: '#1c2028', shadow: '#0d1018', highlight: '#55515c', skin: '#262a31', skinShadow: '#0a0e15', visor: '#e2e9ba', accent: '#ded5a7', metal: '#b5c1a1' },
    body: { height: 1.06, shoulder: 0.88, limbWidth: 0.85, torsoWidth: 0.86, legLength: 1.07 },
    details: ['organic-segments', 'pale-jewel-studs', 'narrow-ribcage', 'long-finger-hands'],
    accessories: ['looping-neck-tubes', 'green-medallion'],
    animation: { stride: 1.08, bob: 0.39, idle: 0.56, dunkStyle: 'reverse' },
  },
  // DIGITAL PUNK wears a pin-covered dark jacket, green collar piping, pink shirt and silver chain.
  'digital-punk': {
    helmet: 'digital-punk', build: 'athletic', silhouette: 'pin-jacket', material: 'leather',
    palette: { base: '#252b29', shadow: '#10181b', highlight: '#56635a', skin: '#2d3834', skinShadow: '#15201d', visor: '#f14fe3', accent: '#4ff29c', metal: '#699784' },
    body: { height: 0.98, shoulder: 0.98, limbWidth: 0.94, torsoWidth: 0.96, legLength: 1.01 },
    details: ['neon-jacket-piping', 'pink-shirt', 'multicolor-lapel-pins', 'rolled-cuffs'],
    accessories: ['silver-chain', 'green-medallion'],
    animation: { stride: 1.18, bob: 1.13, idle: 1.16, dunkStyle: 'windmill' },
  },
  // MANGA is intentionally monochrome: horned ink armor, white edge cuts, hatching and ornate shoulders.
  manga: {
    helmet: 'manga', build: 'athletic', silhouette: 'ink-regalia', material: 'ink',
    palette: { base: '#49484d', shadow: '#141519', highlight: '#f1eeeb', skin: '#77747a', skinShadow: '#29282e', visor: '#d8d4d5', accent: '#fffaf3', metal: '#bdb9bc' },
    body: { height: 1.04, shoulder: 1.06, limbWidth: 0.95, torsoWidth: 0.96, legLength: 1.03 },
    details: ['ink-dragon-pauldrons', 'crosshatched-armor', 'white-edge-cuts', 'halftone-robe'],
    accessories: ['horned-crown', 'ink-dragon-staff', 'monochrome-medallion'],
    animation: { stride: 1.11, bob: 0.69, idle: 0.44, dunkStyle: 'scissor' },
  },
  // MASK's lime visor and vertical respirator grille rise above an unusually broad gray shearling collar.
  mask: {
    helmet: 'mask', build: 'power', silhouette: 'shearling-coat', material: 'leather',
    palette: { base: '#554b43', shadow: '#29272a', highlight: '#817368', skin: '#463f39', skinShadow: '#242326', visor: '#7aee52', accent: '#57ce9c', metal: '#8f8272' },
    body: { height: 1.01, shoulder: 1.12, limbWidth: 1.04, torsoWidth: 1.08, legLength: 0.99 },
    details: ['broad-shearling-collar', 'double-breasted-coat', 'ribbed-sleeves', 'heavy-boots'],
    accessories: ['side-antennae', 'green-medallion'],
    animation: { stride: 0.95, bob: 0.65, idle: 0.48, dunkStyle: 'tomahawk' },
  },
  // NEURAL's glassy purple shell is traced with cyan/magenta circuits and curved cables ending in orbs.
  neural: {
    helmet: 'neural', build: 'lean', silhouette: 'circuit-shell', material: 'holographic',
    palette: { base: '#211c44', shadow: '#090b22', highlight: '#6a3da5', skin: '#10152c', skinShadow: '#050812', visor: '#f978f7', accent: '#5de9f4', metal: '#b292e4' },
    body: { height: 1.05, shoulder: 0.89, limbWidth: 0.86, torsoWidth: 0.88, legLength: 1.07 },
    details: ['cyan-circuit-traces', 'magenta-circuit-traces', 'glass-joint-rings', 'luminous-shins'],
    accessories: ['orb-cables', 'purple-head-studs', 'magenta-medallion'],
    animation: { stride: 1.09, bob: 0.33, idle: 1.02, dunkStyle: 'reverse' },
  },
};

export function getCharacterArt(id) {
  return CHARACTER_ART[id] || CHARACTER_ART.chief;
}
