// Authored against the original 750 x 750 collection JPGs, never generated art.
// Pixel coordinates remain readable here; exported coordinates are normalized.
const polygon = points => points.map(([x, y]) => [x / 750, y / 750]);
const point = (x, y) => [x / 750, y / 750];

export const NFT_PROFILES_A = {
  chief: {
    head: {
      polygon: polygon([[375,52],[414,56],[451,75],[479,106],[498,144],[508,184],[513,224],[520,270],[518,307],[505,347],[485,383],[465,421],[437,447],[402,460],[350,461],[318,449],[285,422],[264,387],[246,354],[231,315],[227,276],[231,233],[242,189],[245,159],[262,119],[292,88],[331,63]]),
      anchor: point(375,463), height: 34,
    },
    torso: {
      polygon: polygon([[278,414],[295,450],[330,472],[375,480],[423,472],[456,452],[473,416],[489,447],[502,474],[540,499],[578,530],[601,571],[613,623],[617,684],[623,749],[125,749],[131,687],[139,628],[150,579],[170,545],[210,518],[246,487],[259,456],[268,433]]),
      top: point(375,480), bottom: point(375,744), width: 34,
    },
    notes: 'Original broad olive helmet, gold luminous face, black honeycomb neck, beveled chest plate and gold medallion. The earlier flat screen and narrow generic chest lost these proportions.',
  },
  bloodbath: {
    head: {
      polygon: polygon([[240,10],[237,31],[243,46],[265,51],[279,57],[291,73],[311,103],[324,76],[334,61],[376,57],[423,59],[449,70],[470,99],[483,139],[508,204],[504,255],[488,345],[476,382],[504,449],[505,477],[488,503],[460,523],[425,539],[384,537],[349,524],[321,503],[300,475],[283,436],[275,389],[271,345],[241,286],[217,235],[234,201],[244,154],[255,121],[272,96],[258,77],[237,62],[230,47],[232,25]]),
      anchor: point(381,536), height: 37,
    },
    torso: {
      polygon: polygon([[275,486],[307,527],[344,548],[382,554],[426,547],[467,526],[501,492],[513,524],[530,558],[548,596],[565,635],[575,682],[579,749],[177,749],[181,694],[190,651],[205,609],[223,572],[242,537],[260,510]]),
      top: point(380,554), bottom: point(376,744), width: 33,
    },
    notes: 'The source has huge white eyes, a long open toothed jaw and tongue, irregular red tendrils, and ribbed crimson chest. Preserve the entire mouth; a small cartoon grin or tidy ponytail changes the identity.',
  },
  optimus: {
    head: {
      polygon: polygon([[373,53],[405,56],[439,73],[467,104],[489,143],[505,184],[509,219],[503,267],[491,313],[475,355],[453,394],[428,427],[408,448],[383,459],[365,453],[343,433],[322,405],[300,375],[282,343],[263,299],[250,252],[244,210],[244,173],[259,130],[280,95],[311,70],[345,56]]),
      anchor: point(378,460), height: 35,
    },
    torso: {
      polygon: polygon([[310,404],[328,438],[345,461],[375,477],[404,464],[422,443],[442,404],[446,433],[459,462],[479,475],[532,489],[541,563],[542,613],[565,680],[586,749],[164,749],[190,680],[208,613],[213,561],[218,490],[270,477],[292,462],[301,435]]),
      top: point(375,477), bottom: point(375,744), width: 27,
    },
    notes: 'The original face is a long black glass oval traced with cyan, above a white ceramic chest with cyan seams and its real medallion. White robot skin must not replace the black glass face or add unrelated armor.',
  },
  quarterback: {
    head: {
      polygon: polygon([[376,31],[414,37],[453,57],[487,87],[510,124],[523,170],[526,212],[523,253],[517,296],[506,337],[489,376],[470,412],[446,440],[417,463],[388,477],[363,475],[338,462],[309,440],[286,412],[269,380],[253,343],[239,298],[228,252],[224,210],[226,169],[238,125],[260,89],[295,58],[337,37]]),
      anchor: point(378,477), height: 35,
    },
    torso: {
      polygon: polygon([[277,403],[298,449],[326,477],[350,488],[377,492],[407,482],[432,459],[461,409],[492,424],[515,447],[537,479],[558,516],[578,560],[587,607],[589,650],[585,700],[579,749],[171,749],[166,697],[161,651],[165,605],[176,561],[195,517],[218,479],[240,446],[258,423]]),
      top: point(375,492), bottom: point(376,744), width: 34,
    },
    notes: 'The original has a smooth silver shell, an unobstructed orange electrical visor, red hydraulic fittings and a graphite chest harness. An invented football face cage obscured the actual face; this mask keeps the source face unchanged.',
  },
  arachnia: {
    head: {
      polygon: polygon([[376,54],[413,59],[449,80],[479,113],[499,150],[507,193],[504,234],[495,277],[484,318],[467,358],[446,395],[424,426],[403,449],[377,466],[354,454],[332,432],[310,406],[290,376],[273,339],[260,299],[249,257],[244,215],[246,171],[260,132],[281,97],[310,72],[343,58]]),
      anchor: point(377,466), height: 34,
    },
    torso: {
      polygon: polygon([[302,407],[320,442],[339,463],[373,475],[410,460],[435,435],[447,407],[458,454],[478,480],[512,498],[556,521],[593,549],[609,582],[592,614],[562,637],[539,669],[530,706],[527,749],[220,749],[216,705],[210,671],[190,639],[159,613],[145,582],[159,552],[194,528],[235,507],[272,487],[291,457]]),
      top: point(375,475), bottom: point(375,742), width: 29,
    },
    notes: 'Keep the narrow polished black face with copper-red embedded nodes, the silver neck hook, layered carbon shoulder/chest panels, and the large red electrical chest core. Flat red web lines alone did not reproduce this armor.',
  },
  elemental: {
    head: {
      polygon: polygon([[374,52],[411,58],[447,77],[475,107],[493,141],[505,177],[507,216],[503,256],[493,299],[477,341],[456,382],[433,417],[407,447],[379,463],[361,458],[338,438],[313,407],[291,375],[273,338],[258,299],[248,257],[244,216],[244,172],[259,129],[283,94],[314,70],[345,57]]),
      anchor: point(375,463), height: 34,
    },
    torso: {
      polygon: polygon([[305,409],[323,442],[345,466],[376,476],[409,465],[434,438],[447,409],[451,439],[466,468],[488,481],[526,489],[540,526],[552,574],[574,625],[591,684],[600,749],[150,749],[160,687],[177,633],[196,579],[210,529],[219,491],[260,481],[285,466],[299,442]]),
      top: point(375,476), bottom: point(375,744), width: 30,
    },
    notes: 'The actual identity is cracked deep-blue crystalline glass inside ivory ceramic, repaired with gold veins; the chest carries turquoise enamel and a coral-red medallion. Preserve those source materials, not a generic white robot recolor.',
  },
  chaos: {
    head: {
      polygon: polygon([[375,54],[412,57],[451,77],[480,106],[499,140],[506,179],[507,216],[500,258],[492,299],[478,340],[462,379],[441,414],[415,444],[386,462],[361,458],[336,440],[315,415],[295,384],[279,350],[264,311],[251,269],[244,227],[245,186],[250,151],[270,115],[293,86],[327,63]]),
      anchor: point(378,462), height: 34,
    },
    torso: {
      polygon: polygon([[305,399],[324,439],[346,463],[377,474],[409,465],[433,440],[448,405],[478,419],[503,441],[525,472],[546,511],[565,559],[586,611],[601,665],[605,749],[147,749],[145,687],[150,632],[160,575],[180,519],[199,476],[223,445],[252,425],[277,416]]),
      top: point(375,474), bottom: point(375,744), width: 32,
    },
    notes: 'Retain the chipped ivory/green helmet and smeared red smile, embroidered purple lapels, green shirt, maroon bow tie, buckled crossing straps and pale flower. These are source textures, not generic purple panels.',
  },
  poison: {
    head: {
      polygon: polygon([[240,10],[237,31],[243,46],[265,51],[279,57],[291,73],[311,103],[324,76],[334,61],[376,54],[420,57],[448,68],[468,94],[481,124],[493,148],[507,183],[513,221],[510,261],[501,300],[489,338],[470,372],[448,398],[427,423],[405,440],[378,450],[352,444],[327,426],[307,402],[291,374],[276,341],[260,310],[243,286],[222,261],[217,235],[235,202],[244,154],[255,121],[272,96],[250,72],[232,52]]),
      anchor: point(378,450), height: 36,
    },
    torso: {
      polygon: polygon([[301,399],[320,435],[344,454],[376,462],[412,451],[443,428],[465,391],[485,417],[505,451],[521,489],[540,528],[562,568],[578,611],[591,655],[597,702],[600,749],[152,749],[156,703],[165,659],[178,616],[196,570],[219,531],[239,493],[257,455],[276,425]]),
      top: point(375,462), bottom: point(375,744), width: 31,
    },
    notes: 'Original blue-black reflective face, amber emblem and attached curling crown are preserved; the chest mask includes the entire ivory rib/spider pattern and pale medal. It must stay dark and glossy rather than olive armor.',
  },
  sheikh: {
    head: {
      polygon: polygon([[374,44],[451,61],[482,82],[502,105],[522,124],[529,147],[524,164],[540,295],[545,347],[557,401],[574,448],[577,469],[564,477],[516,470],[500,456],[477,442],[449,447],[415,460],[376,464],[317,448],[290,442],[267,456],[245,473],[222,479],[177,473],[173,457],[181,433],[198,400],[211,352],[221,292],[226,232],[231,171],[220,167],[219,151],[225,128],[245,105],[269,80],[300,59],[335,47]]),
      anchor: point(375,462), height: 36,
    },
    torso: {
      polygon: polygon([[271,470],[299,461],[327,462],[352,467],[375,472],[402,467],[429,462],[455,463],[482,473],[509,491],[532,528],[550,574],[564,626],[574,682],[581,749],[172,749],[181,684],[194,627],[211,575],[232,528],[251,491]]),
      top: point(375,472), bottom: point(375,744), width: 32,
    },
    notes: 'Preserve both full woven ghutra drapes, black braided agal, uninterrupted black/gold face, and the robe gold embroidery with red/green edge stripes. The original cloth silhouette is wider than the common helmet template.',
  },
};
