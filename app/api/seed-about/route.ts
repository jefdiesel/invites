import { supabase } from "@/lib/db";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const ABOUT_DATA: Record<string, {
  headline: string;
  story: string;
  photos: { url: string; alt: string; caption: string; category: string }[];
}> = {
  "chez-laurent": {
    headline: "Our Story",
    story: `Chef Laurent Moreau grew up in a kitchen in Lyon, watching his grandmother turn the simplest ingredients into something that made a room go quiet. She never measured anything. She tasted, adjusted, tasted again. By the time he was twelve, he could make a proper béarnaise with his eyes closed.

He trained at Institut Paul Bocuse, staged at three Michelin-starred restaurants across Paris, and spent two years cooking in Tokyo, where he learned that restraint is its own kind of generosity. A single perfect bite can say more than a twelve-course meal.

He came to Portland in 2018 because he fell in love with the farms. The Willamette Valley grows everything he missed from France, and things he never knew he needed. He found a space on Oak Street with good light, brick walls, and a kitchen that faces the dining room. He wanted his guests to see the cooking. No separation. No mystery. Just the work.

Chez Laurent opened in the spring of 2019 with twelve tables and a menu that changes every week. The only rule is that everything comes from within a hundred miles. Laurent drives to the farms himself on Tuesday mornings. He picks what looks best and builds the menu around it. If the chanterelles are perfect, you get chanterelles. If the tomatoes are still a week away, you wait.

The wine list is short and personal. Every bottle is something Laurent has drunk himself and loved. He does not carry wines because they score well or because a distributor pushes them. He carries wines that make food taste better. Ask the server what to drink and they will steer you right.

The dining room seats forty. We take reservations and we recommend them, especially on weekends. Walk-ins are welcome at the bar, where you can eat the full menu and watch the kitchen work. Friday and Saturday nights, Laurent runs a five-course tasting menu that tells the story of what the farms brought that week. It is the best way to eat here.

We are closed Sundays and Mondays because Laurent believes cooks should have lives. The rest of the week, we are here, doing the thing we love. Come hungry.`,
    photos: [
      { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80", alt: "A plated dish at Chez Laurent: seared salmon on a bed of lentils with herb butter, served on a white ceramic plate", caption: "Pan-seared salmon with lentils du Puy", category: "about" },
      { url: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1200&q=80", alt: "Chef Laurent Moreau working at the pass in the open kitchen, plating dishes under warm pendant lights", caption: "Chef Laurent at the pass", category: "about" },
      { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80", alt: "The Chez Laurent dining room at evening service: brick walls, candlelit tables, warm amber lighting, guests seated at white-clothed tables", caption: "Evening service in the dining room", category: "about" },
    ],
  },
  "nori": {
    headline: "The Counter",
    story: `Nori exists because Chef Kenji Tanaka believes the best meal is the one where you watch it being made. Twelve seats at a hinoki cypress counter. One seating per night. No menu. You eat what the ocean and the seasons bring.

Tanaka trained for eight years under Master Jiro Yamamoto in Ginza, learning the discipline of simplicity. Every cut matters. The angle of the knife against the fish. The temperature of the rice, which must be body temperature, exactly. The wasabi grated fresh for each piece, not a minute before it reaches your hand. These are not details. They are the whole point.

He came to New York in 2021 with a single suitcase and a set of knives his teacher gave him. He found a narrow space on Spring Street that reminded him of the counter in Ginza where he spent his twenties. He stripped it to bare concrete and white oak. He installed a single glass case for the fish. He hung one scroll on the wall. That was enough.

The omakase is twelve courses. It begins with lighter fish and builds toward richer, fattier cuts. The rice is seasoned with red vinegar from a brewery in Chiba that has been making it for three hundred years. The nori is roasted daily. The soy sauce is aged. Nothing on this counter is accidental.

Tanaka sources fish from Tsukiji through a buyer he has known for fifteen years, supplemented by day-boat catches from Montauk and the Maine coast. If a fish is not perfect, it does not get served. There is no backup plan. Some nights the menu is ten courses instead of twelve because something was not right. He would rather serve less than serve anything mediocre.

There is a sake pairing curated by our sommelier, Yuki, who selects five pours to follow the progression of the meal. There is also a non-alcoholic pairing of house-made teas, fresh juices, and a dashi broth that is worth the visit on its own.

Reservations open thirty days in advance and fill within hours. We seat at 6 PM. The meal lasts approximately two hours. We ask that you arrive on time and that you trust the chef. That is all we ask.`,
    photos: [
      { url: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80", alt: "A piece of otoro nigiri being placed on a hinoki cypress counter by the chef's hands, glistening under soft light", caption: "Otoro nigiri, placed by hand", category: "about" },
      { url: "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=1200&q=80", alt: "The twelve-seat hinoki cypress counter at Nori, empty before service, with a glass fish case and single hanging pendant light", caption: "The counter before service", category: "about" },
      { url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&q=80", alt: "An arrangement of fresh sashimi slices on ice: tuna, yellowtail, and sea bream, garnished with shiso leaf", caption: "Today's selection from Tsukiji", category: "about" },
    ],
  },
  "copper-hen": {
    headline: "From the Farm",
    story: `The Copper Hen started with a chicken. Specifically, a Rhode Island Red that wandered into Sarah and Tom Aldridge's backyard in 2015, back when they were still working desk jobs in the city. They kept it. Then they got five more. Then they bought the land.

The farm came first. Thirty acres in the Hudson Valley, half-wooded, with a creek that runs cold year-round. They started with chickens and a kitchen garden. Then came the pigs, then the goats, then the greenhouse. They sold eggs at the farmers market on Saturdays and cooked for friends on Sundays. Those Sunday dinners grew from six people to twenty to sixty. Someone said they should open a restaurant. They said that was crazy. Then they did it anyway.

The building is a converted barn on Rural Route 7, halfway between Hudson and Claverack. Tom did most of the renovation himself, keeping the original beams and stone foundation. The wood-fired oven was built by a mason from Vermont who learned the craft in Tuscany. It is the heart of the kitchen. Everything passes through it or near it. The bread, the chicken, the vegetables, the desserts. Even the butter gets a minute near the flames.

Sarah runs the kitchen. She never went to culinary school. She learned to cook from her mother, from the Zuni Cafe Cookbook, from the farms themselves. When you grow your own food, you cook differently. You cook what is ready, not what you planned. The menu changes not weekly but daily, sometimes between lunch and dinner, depending on what came in from the field that morning.

The vegetables are the stars. People come expecting the chicken, which is extraordinary, but they leave talking about the beets. Or the kale salad. Or the roasted carrots that taste like candy because they were in the ground until that morning. We do not have a walk-in full of produce from a distributor. We have a garden fifty feet from the kitchen door.

The wine list is small and leans natural. The cider is pressed from our own apples. The bread is sourdough, baked every morning in the wood oven from flour milled in the Catskills. We make our own butter. We cure our own bacon. We do not do this because it is trendy. We do it because it tastes better and because we can.

We are open Wednesday through Saturday for dinner, and Sunday for brunch. We are closed Monday and Tuesday because the farm needs tending and so do we.`,
    photos: [
      { url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&q=80", alt: "Morning light on the Copper Hen farm: a wooden fence in the foreground, green fields stretching to a tree line, mist rising", caption: "Morning on the farm", category: "about" },
      { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80", alt: "A rustic plated dish: wood-fired chicken leg on a ceramic plate with roasted root vegetables and herb butter", caption: "Wood-fired chicken with roasted roots", category: "about" },
      { url: "https://images.unsplash.com/photo-1464500422302-6188776dcbab?w=1200&q=80", alt: "The interior of The Copper Hen: exposed wooden beams, stone walls, candlelit tables with linen napkins, warm amber lighting", caption: "The dining room in the old barn", category: "about" },
    ],
  },
  "bennys": {
    headline: "The Story",
    story: `Benny Navarro opened the first Benny's on South Congress in 2020, three weeks before everything shut down. Terrible timing. Best decision he ever made.

He had been flipping burgers since he was sixteen, working the flat-top at his uncle's taqueria in San Antonio. He learned two things there: good food does not have to be expensive, and people come back for the way a place makes them feel, not just what is on the plate. His uncle's place had twelve tables, a jukebox that only played Selena and Los Tigres del Norte, and a line out the door every Saturday night.

Benny wanted to build something like that but for burgers. Not the fancy kind with truffle aioli and a brioche bun that falls apart in your hands. Real burgers. Smashed thin on a screaming hot griddle until the edges get crispy and dark. American cheese because it melts better than anything else. Pickles, onion, a sauce he spent six months getting right. That is the Classic. It is four dollars and it is perfect.

When the shutdown hit, Benny pivoted to takeout and delivery on day one. He set up a window on the sidewalk and started handing bags through it. People drove from across town. The line wrapped around the block. He sold eight hundred burgers in the first week. By the time indoor dining came back, Benny's was already a thing.

The shakes are hand-spun, made with real ice cream from a dairy in Dripping Springs. The vanilla malt is the one to get. It is thick enough that you have to wait thirty seconds before the straw works, and that wait is part of the experience. The fries are hand-cut every morning from whole Kennebec potatoes, soaked in water overnight, fried twice. They are salty and crispy and gone in about ninety seconds.

The space on South Congress is small. Twenty-two seats inside, a few picnic tables on the patio. The walls are covered in stickers and Polaroids and a neon sign that says SMASH in red letters. The music is loud. The vibe is chaotic. You will probably have to wait. It is worth it.

Benny is still on the flat-top most nights. He says he will stop cooking when it stops being fun. It has not stopped being fun.`,
    photos: [
      { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80", alt: "A double smash burger on a paper-lined tray: two thin crispy patties, melted American cheese, pickles, and Benny's sauce on a soft bun", caption: "The Classic: double smash, American cheese, Benny's sauce", category: "about" },
      { url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80", alt: "The interior of Benny's: a narrow room with counter seating, neon signs, stickers covering the walls, and customers eating burgers", caption: "Inside the South Congress original", category: "about" },
      { url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=1200&q=80", alt: "A thick vanilla milkshake in a metal tin with a paper straw, condensation on the outside, sitting on a red formica counter", caption: "The vanilla malt, thick enough to stand a spoon in", category: "about" },
    ],
  },
  "volta": {
    headline: "What We're About",
    story: `Volta opened in the Mission in 2023 because Chef Diana Reyes got tired of choosing between good food and good energy. Every restaurant she had worked at was one or the other. The serious places with great food had the personality of a library. The fun places with great drinks had food that was an afterthought. She wanted both. She wanted a place where the food could be ambitious and the room could be loud and nobody had to whisper.

Reyes grew up in Mexico City and cooked in San Francisco, Copenhagen, and Lima before coming back to the Bay Area. She is not interested in a single cuisine. She is interested in bold flavors from everywhere, prepared with California ingredients and served without pretension. The menu changes constantly. What stays is the attitude: everything should taste like someone cared.

The burrata is the dish that put Volta on the map. Stone fruit, pistachios, aged balsamic. It sounds simple. It is simple. But the burrata is from a maker in Petaluma who delivers it the morning it is made. The stone fruit comes from Frog Hollow Farm. The balsamic is twenty-five years old. Simple food made with impossible ingredients tastes like nothing else.

The wine list is natural, mostly European, chosen by sommelier Marcus Cole, who has a gift for finding bottles that taste alive. Funky but not flawed. Interesting but not homework. If you do not know what you want, tell Marcus what you had for lunch and he will pick something that will change your evening.

The space is a former auto body shop. They kept the concrete floors and the roll-up garage door that opens onto Mission Street when the weather is right. The art rotates monthly from local artists. The sound system is good. The playlist is Marcus, who believes that what you hear while you eat matters as much as what you taste.

Volta seats fifty, plus twelve at the bar. Reservations are recommended but the bar is always available for walk-ins. Sunday through Thursday you can usually get in. Friday and Saturday, book ahead. The kitchen is open until eleven on weekends because Reyes believes that the best meals happen late, when nobody is in a hurry and the cooks are in the zone.

We are closed Mondays. Not because we are tired. Because even the best restaurants need a day to miss it.`,
    photos: [
      { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80", alt: "The Volta dining room at night: concrete floors, industrial pendant lights, diners at wooden tables, the garage door open to the street", caption: "The dining room with the garage door open", category: "about" },
      { url: "https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=1200&q=80", alt: "A plate of burrata with stone fruit, pistachios, and aged balsamic drizzle on a dark ceramic plate at Volta", caption: "The burrata: stone fruit, pistachios, aged balsamic", category: "about" },
      { url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200&q=80", alt: "Volta's bar at night: bottles backlit on shelves, a bartender pouring a cocktail, warm amber light reflecting off the concrete bar top", caption: "The bar, where walk-ins are always welcome", category: "about" },
    ],
  },
};

const GALLERY_DATA: Record<string, { url: string; alt: string; caption: string; category: string }[]> = {
  "chez-laurent": [
    { url: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=1200&q=80", alt: "A glass of red wine on a white tablecloth with soft candlelight in the background at Chez Laurent", caption: "Evening wine service", category: "interior" },
    { url: "https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=1200&q=80", alt: "Close-up of a crème brûlée being torched tableside, golden sugar crackling under blue flame", caption: "Crème brûlée, torched tableside", category: "food" },
    { url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80", alt: "A colorful salad of roasted beets, goat cheese, and candied walnuts on a white plate", caption: "Roasted beet salad with chèvre", category: "food" },
    { url: "https://images.unsplash.com/photo-1507914997854-c90d3005c0f0?w=1200&q=80", alt: "The bar area at Chez Laurent with bottles on shelves, warm wood, and two guests seated on leather stools", caption: "The bar", category: "interior" },
    { url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80", alt: "A dry-aged ribeye steak with pommes frites and herb butter on a dark plate", caption: "Dry-aged ribeye with pommes frites", category: "food" },
    { url: "https://images.unsplash.com/photo-1560053608-13721e0d69e5?w=1200&q=80", alt: "Fresh bread loaves cooling on a wire rack in the Chez Laurent kitchen", caption: "House bread, baked daily", category: "food" },
  ],
  "nori": [
    { url: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80", alt: "A row of nigiri pieces arranged on a cypress board at Nori, each topped with different fish", caption: "The omakase progression", category: "food" },
    { url: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=80", alt: "Chef Tanaka slicing fish with a yanagiba knife, precise thin cuts, hands in focus", caption: "Precision cuts", category: "food" },
    { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80", alt: "A small ceramic cup of warm sake on the hinoki counter with soft lighting", caption: "Sake from the pairing", category: "food" },
    { url: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80", alt: "A single piece of uni sushi on a wooden board, bright orange sea urchin on seasoned rice", caption: "Uni, Hokkaido", category: "food" },
    { url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80", alt: "The glass fish case at Nori displaying whole fish on ice, lit from above", caption: "The fish case before service", category: "interior" },
  ],
  "copper-hen": [
    { url: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=1200&q=80", alt: "Sunrise over the Copper Hen farm fields, golden light filtering through trees", caption: "Sunrise on the farm", category: "interior" },
    { url: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=1200&q=80", alt: "A wood-fired oven with flames visible inside, fresh bread on a peel ready to go in", caption: "The wood-fired oven", category: "interior" },
    { url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=80", alt: "A rustic plate of braised pork shoulder with apple cider jus and mashed potatoes on a wooden table", caption: "Braised pork shoulder", category: "food" },
    { url: "https://images.unsplash.com/photo-1457296898342-cdd24585d095?w=1200&q=80", alt: "Freshly picked carrots, beets, and radishes in a wooden crate, still covered in dirt", caption: "This morning's harvest", category: "food" },
    { url: "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=1200&q=80", alt: "A hand-thrown ceramic bowl of chocolate pudding topped with whipped cream and sea salt flakes", caption: "Chocolate pudding with sea salt", category: "food" },
    { url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80", alt: "Three bottles of natural cider from the Copper Hen farm on a rustic shelf", caption: "House-pressed cider", category: "food" },
  ],
  "bennys": [
    { url: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&q=80", alt: "A smash burger being pressed on a flat-top griddle, steam rising, the patty edges crisping", caption: "On the flat-top", category: "food" },
    { url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200&q=80", alt: "A paper tray of hand-cut fries with a ramekin of Benny's sauce, golden and crispy", caption: "Hand-cut fries", category: "food" },
    { url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&q=80", alt: "Two thick milkshakes in metal tins, one chocolate one vanilla, with paper straws on a red counter", caption: "Shakes: chocolate PB and vanilla malt", category: "food" },
    { url: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80", alt: "The exterior of Benny's at night: neon SMASH sign glowing red, people at picnic tables on the patio", caption: "The patio at night", category: "interior" },
    { url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80", alt: "Close-up of The Classic burger: double smash patty, melted cheese, pickles, onion, sauce dripping", caption: "The Classic, up close", category: "food" },
  ],
  "volta": [
    { url: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80", alt: "The Volta bar at night with guests seated, bottles backlit on shelves, warm pendant lights", caption: "The bar", category: "interior" },
    { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80", alt: "A beautifully plated dish: grilled branzino with salsa verde and charred lemon on a dark plate", caption: "Grilled branzino, salsa verde", category: "food" },
    { url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80", alt: "A flight of three natural wines in stemless glasses on a concrete surface", caption: "Natural wine flight", category: "food" },
    { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80", alt: "Volta's dining room from above: concrete floors, wooden tables, diners, the garage door open to Mission Street at dusk", caption: "The room at dusk", category: "interior" },
    { url: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=80", alt: "Handmade pappardelle with wild boar ragu being twirled on a fork, pecorino shavings visible", caption: "Pappardelle, wild boar ragu", category: "food" },
    { url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1200&q=80", alt: "An olive oil cake slice with Meyer lemon curd and crème fraîche on a white plate", caption: "Olive oil cake", category: "food" },
  ],
};

export async function POST() {
  const results: string[] = [];

  for (const [slug, data] of Object.entries(ABOUT_DATA)) {
    // Get business ID
    const { data: biz } = await supabase.from("businesses").select("id").eq("slug", slug).single();
    if (!biz) { results.push(`${slug}: not found`); continue; }

    // Update editorial content
    await supabase.from("businesses").update({
      about_headline: data.headline,
      about_story: data.story,
    }).eq("id", biz.id);

    // Delete existing photos for this business (idempotent)
    await supabase.from("business_photos").delete().eq("business_id", biz.id);

    // Insert photos (about + gallery)
    const allPhotos = [...data.photos, ...(GALLERY_DATA[slug] ?? [])];
    for (const [i, photo] of allPhotos.entries()) {
      await supabase.from("business_photos").insert({
        id: randomUUID(),
        business_id: biz.id,
        url: photo.url,
        alt: photo.alt,
        caption: photo.caption,
        category: photo.category,
        sort_order: i,
      });
    }

    results.push(`${slug}: updated (${data.story.split(/\s+/).length} words, ${data.photos.length} photos)`);
  }

  return NextResponse.json({ results });
}
