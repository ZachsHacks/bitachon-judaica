#!/usr/bin/env python3
# Builds basic on-brand subpages for Bitachon Judaica, sharing one stylesheet.
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Bitachon Judaica</title>
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Playfair+Display:wght@500;600&family=Jost:wght@300;400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v=20261022-gifts-2">
<link rel="stylesheet" href="/assets/refinement.css?v=20261022-closure">
<script>/* On the live site read our own API. Anywhere else (Vercel preview, localhost) read the
live API so previews show the real products. */
window.BJ_API=/(^|\\.)bitachonjudaica\\.com$/.test(location.hostname)?"":"https://bitachonjudaica.com";</script>
<script src="/assets/catalog-photos.js"></script>
<script src="/assets/cart.js" defer></script>
<script src="/assets/store-closure.js?v=20261023-notice" defer></script>
<script src="/assets/external-links.js" defer></script>
</head>
<body>\n
<div class="shabbos-notice" data-persistent-notice role="note" aria-label="Shabbos and Yom Tov observance">OUR SHOP IS CLOSED FOR SHABBOS AND YOM TOV. PLEASE VISIT US AGAIN AFTERWARD.</div>
<header>
  <div class="topbar">
    <a href="/" class="logo brand"><img class="logo-img" src="/assets/logo.png" alt="Bitachon Judaica"><span><span class="brand-text">Bitachon Judaica</span><span class="brand-destination">The Complete Jewish Shopping Destination</span><span class="brand-meaning" style="display:block;font-size:12px;line-height:1.5;margin-top:8px;color:#5a626d">Bitachon means trust in Hashem</span><span class="brand-promise">Know what you want but can\'t find it? Tell us.</span></span></a>
    <div class="header-links"><nav aria-label="Main navigation"><ul>
      <li><a href="/shop.html">Shop</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/contact.html">Contact</a></li>
    </ul></nav>
    <a class="icons cart-link" href="/cart.html">Cart (<span data-cart-count>0</span>)</a></div>
  </div>
</header>
<main>
"""

FOOT = """</main>
<footer>\n  <div class="wrap shopping-signoff"><p>Enjoy shopping</p><a href="/shop.html">Explore the shop &rarr;</a></div>
  <div class="wrap frow">
    <div class="flogo">BITACHON JUDAICA</div>
    <nav><ul style="display:flex;gap:30px;list-style:none;font-size:12px;letter-spacing:.18em;text-transform:uppercase">
      <li><a href="/shop.html">Shop</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/bulk.html">Bulk Orders</a></li>
      <li><a href="/shipping.html">Shipping</a></li>
      <li><a href="/contact.html">Contact</a></li>
    </ul></nav>
  </div>
  <div class="wrap fbtm">Copyright 2026 Bitachon Judaica</div>
</footer>
</body>
</html>
"""

def page(filename, title, body, full_title=None):
    html = HEAD.format(title=title) + body + FOOT
    if filename == "index.html":
        html = html.replace('<span class="brand-text">Bitachon Judaica</span>', '<h1 class="brand-text">Bitachon Judaica</h1>', 1)
    if filename == "about.html":
        html = html.replace('<span class="brand-destination">The Complete Jewish Shopping Destination</span>', '<span class="brand-destination">The Complete Jewish Shopping Destination</span><span style="display:block;font-family:Jost,sans-serif;font-size:14px;line-height:1.5;font-weight:400;letter-spacing:.08em;color:#B8923D;margin-top:10px">Trust in Hashem</span>', 1)
    if full_title:
        html = html.replace(f"<title>{title} | Bitachon Judaica</title>", f"<title>{full_title}</title>", 1)
    with open(os.path.join(OUT, filename), "w") as f:
        f.write(html)
    print("wrote", filename)

def hero(ey, h1, sub=""):
    p = f'<p>{sub}</p>' if sub else ''
    return (f'<div class="page-hero"><span class="ey">{ey}</span><h1>{h1}</h1>'
            f'{p}<div class="divider"></div></div>')

def grid(category):
    arg = "null" if category is None else '"' + category.replace('"', '\\"') + '"'
    return ('<section><div class="wrap">'
            '<div id="search" class="searchwrap"></div>'
            '<nav id="catnav" class="catnav"></nav>'
            '<div id="products" class="cats"></div>'
            '</div></section>'
            '<script src="/assets/store.js?v=20261022-compact"></script>'
            f'<script>BJStore.renderSearch("search");BJStore.render("products", {arg});'
            f'BJStore.renderCats("catnav", {arg})</script>')

def band(ey, h2, href, label):
    return f'<div class="band"><div class="wrap"><span class="ey">{ey}</span><h2>{h2}</h2><a href="{href}">{label}</a></div></div>'

# ---- Shop (all products + dynamic category nav) ----
# ---- Homepage: a storefront, not a splash page. Everything she sells is visible right away. ----
home = """
<div class="home-hero">
  <div class="wrap">
    <p class="home-kicker">Mezuzah covers, gifts, apparel, sheitels, and Jewish art.</p>
    <div id="search" class="searchwrap"></div>
  </div>
</div>

<div class="own-collection-shortcut"><a href="/shop.html">Shop Bitachon Judaica Gifts <span aria-hidden="true">&rarr;</span></a></div>
<section class="gift-discovery" aria-label="Explore gifts on Amazon and Etsy">
  <div class="wrap">
    <nav class="gift-buttons" aria-label="Explore gifts on Amazon">
      <a href="https://www.amazon.com/s?k=unique+jewish+gifts&amp;rh=p_36%3A-2500&amp;linkCode=ll2&amp;tag=bitachonjudai-20&amp;linkId=cb5855fb0f71fce89bed054db772c014&amp;language=en_US&amp;ref_=as_li_ss_tl" target="_blank" rel="sponsored external noopener">Unique Gifts Under $25 <span aria-hidden="true">&#8599;</span></a>
      <a href="https://www.amazon.com/s?k=personalized+jewish+gifts&amp;tag=bitachonjudai-20" target="_blank" rel="sponsored external noopener">Personalized Gifts <span aria-hidden="true">&#8599;</span></a>
      <a href="https://www.amazon.com/s?k=jewish+gifts&amp;tag=bitachonjudai-20" target="_blank" rel="sponsored external noopener">Jewish Gifts <span aria-hidden="true">&#8599;</span></a>
    </nav>
    <h3 class="gift-retailer-heading">Shop gifts on Amazon</h3>

    <nav class="gift-buttons" aria-label="Explore gifts on Etsy">
      <a href="https://www.etsy.com/market/unique_gifts?max=25" target="_blank" rel="external noopener">Unique Gifts Under $25 <span aria-hidden="true">&#8599;</span></a>
      <a href="https://www.etsy.com/c/gifts/personalized-gifts" target="_blank" rel="external noopener">Personalized Gifts <span aria-hidden="true">&#8599;</span></a>
      <a href="https://www.etsy.com/market/jewish_gifts" target="_blank" rel="external noopener">Jewish Gifts <span aria-hidden="true">&#8599;</span></a>
    </nav>
    <h3 class="gift-retailer-heading">Shop gifts on Etsy</h3>
\n    <p class="gift-shopping-note">Amazon and Etsy open in a new tab, where you complete your purchase. Prices and availability may change. The $25 limit is before shipping, taxes, and personalization extras. As an Amazon Associate I earn from qualifying purchases.</p>
    <div class="more-gift-shops">
      <h3>More Jewish Gift Shops</h3>
      <nav class="gift-buttons" aria-label="More Jewish gift shops">
        <a href="https://www.judaicawebstore.com/" target="_blank" rel="external noopener">Judaica WebStore <span aria-hidden="true">&#8599;</span></a>
        <a href="https://moderntribe.com/" target="_blank" rel="external noopener"><span>ModernTribe<small style="display:block;font-size:12px;line-height:1.5;margin-top:4px">Jewish gifts and Judaica for holidays and everyday life</small></span><span aria-hidden="true">&#8599;</span></a>
        <a href="https://www.hasofer.com/" target="_blank" rel="external noopener"><span>HaSOFER<small style="display:block;font-size:12px;line-height:1.5;margin-top:4px">Judaica, silver gifts, tallitot, tefillin, and mezuzot</small></span><span aria-hidden="true">&#8599;</span></a>
        <a href="https://israelicenterofjudaica.com/" target="_blank" rel="external noopener">Israel Center of Judaica <span aria-hidden="true">&#8599;</span></a>
        <a href="https://judaica.city/" target="_blank" rel="external noopener"><span>Judaica.city<small style="display:block;font-size:12px;line-height:1.5;margin-top:4px">Custom kippahs, challah covers, and Kiddush essentials</small></span><span aria-hidden="true">&#8599;</span></a>
        <a href="https://www.israel-catalog.com/" target="_blank" rel="external noopener">Israel-Catalog <span aria-hidden="true">&#8599;</span></a>

        <a href="https://www.judaica.com/" target="_blank" rel="external noopener"><span>Judaica.com<small style="display:block;font-size:12px;line-height:1.5;margin-top:4px">Jewish gifts, Shabbat essentials, and home decor</small></span><span aria-hidden="true">&#8599;</span></a>
        <a href="https://kosher-innovations.com/" target="_blank" rel="external noopener"><span>Kosher Innovations<small style="display:block;font-size:12px;line-height:1.5;margin-top:4px">Practical Shabbos products for the Jewish home</small></span><span aria-hidden="true">&#8599;</span></a>
        <a href="https://www.judaica-mall.com/" target="_blank" rel="external noopener"><span>Judaica Mall<small style="display:block;font-size:12px;line-height:1.5;margin-top:4px">Judaica and Jewish gifts for celebrations and the home</small></span><span aria-hidden="true">&#8599;</span></a>
        <a href="https://ahuva.com/" target="_blank" rel="external noopener"><span>ahuva<small style="display:block;font-size:12px;line-height:1.5;margin-top:4px">Judaica, Jewish gifts, holiday treasures, and home decor</small></span><span aria-hidden="true">&#8599;</span></a>
      </nav>
      <h3>Luxury Gifts</h3>
      <nav class="gift-buttons luxury-gift-buttons" aria-label="Explore luxury gifts and jewelry">
        <a href="https://www.judaicawebstore.com/hanukkah-menorahs-c106/925-Sterling-Silver.aspx" target="_blank" rel="external noopener">Silver Menorahs <span aria-hidden="true">&#8599;</span><small>Judaica WebStore</small></a>
        <a href="https://israelicenterofjudaica.com/product-category/judaica/jewish-candelabras/" target="_blank" rel="external noopener">Silver Candelabras <span aria-hidden="true">&#8599;</span><small>Israel Center of Judaica</small></a>
        <a href="https://www.brilliantearth.com/stores/beverly-hills-ca-90210/" target="_blank" rel="external noopener">Brilliant Earth <span aria-hidden="true">&#8599;</span><small>Beverly Hills luxury jewelry</small></a>
        <a href="https://ashleyzhangjewelry.com/" target="_blank" rel="external noopener">Ashley Zhang Jewelry <span aria-hidden="true">&#8599;</span><small>Manhattan Diamond District fine jewelry</small></a>
        <a href="https://www.amcordesign.com/" target="_blank" rel="external noopener">Amcor Design <span aria-hidden="true">&#8599;</span><small>Diamond District engagement rings and wedding bands</small></a>
        <a href="https://themjewelersny.com/" target="_blank" rel="external noopener">The M Jewelers <span aria-hidden="true">&#8599;</span><small>New York personalized gold and silver jewelry</small></a>
        <a href="https://jenniferfisher.com/" target="_blank" rel="external noopener">Jennifer Fisher <span aria-hidden="true">&#8599;</span><small>Beverly Hills fine jewelry</small></a>
        <a href="https://www.goldpointbk.com/" target="_blank" rel="external noopener">Goldpoint Jewelry <span aria-hidden="true">&#8599;</span><small>Greenpoint, Brooklyn fine jewelry</small></a>
        <a href="https://azramehdijewelry.com/" target="_blank" rel="external noopener">Azra Mehdi Jewelry <span aria-hidden="true">&#8599;</span><small>Beverly Hills fine jewelry</small></a>
        <a href="https://www.fybjewelry.com/" target="_blank" rel="external noopener">FYB Jewelry <span aria-hidden="true">&#8599;</span><small>Brooklyn gold-plated demi-fine jewelry</small></a>
        <a href="https://gatherbk.com/" target="_blank" rel="external noopener">Gather Brooklyn <span aria-hidden="true">&#8599;</span><small>Thoughtfully made Brooklyn jewelry</small></a>
        <a href="https://www.freidarothman.com/" target="_blank" rel="external noopener">FREIDA ROTHMAN <span aria-hidden="true">&#8599;</span><small>Brooklyn-inspired jewelry and meaningful gifts</small></a>
        <a href="https://www.perrygargano.com/" target="_blank" rel="external noopener">Perry Gargano / 242 Grand Jewelry <span aria-hidden="true">&#8599;</span><small>Distinctive jewelry from Williamsburg, Brooklyn</small></a>
        <a href="https://www.jewelryjudaica.com/" target="_blank" rel="external noopener">Jewelry Judaica <span aria-hidden="true">&#8599;</span><small>Jewish necklaces, pendants, and meaningful jewelry</small></a>
        <a href="https://www.judaicawebstore.com/" target="_blank" rel="external noopener">Judaica WebStore Jewelry <span aria-hidden="true">&#8599;</span><small>Jewish jewelry and gifts for special occasions</small></a>
      </nav>
      <p class="gift-shopping-note">Each shop opens in a new tab, where you complete your purchase with that retailer. Prices and availability may change. These are ordinary retailer links; Bitachon Judaica does not currently earn commissions from links in this section.</p>
    </div>

  </div>
</section>
<section class="catalog-section" id="collection">
  <div class="wrap">
    <p class="collection-eyebrow">Discover gifts from Bitachon Judaica</p>
    <div class="catalog-heading"><h2 class="sec-title collection-welcome" id="collection-heading">Enjoy shopping</h2><a class="collection-link" href="/shop.html">View our entire collection &rarr;</a></div>
    <p class="collection-intro collection-help">Know what you want but can\'t find it? <a href="/contact.html">Tell us.</a></p>
    <nav id="catnav" class="catnav"></nav>
    <div id="products" class="cats"></div>
  </div>
</section>
<script src="/assets/store.js?v=20261022-compact"></script>
<script>
window.BJ_HOME = true;
BJStore.renderSearch("search");
BJStore.renderCats("catnav", null);
BJStore.render("products", null, true);
</script>
"""
page("index.html", "Home", home, full_title="Bitachon Judaica")

# The old "made one piece at a time" line is gone on purpose: it is not true of the shirts,
# sheitels, baby gifts, or anything ordered in, only of the clay work.
shop = (grid(None)
        + band("For schools &amp; groups", "Bulk &amp; custom orders", "/bulk.html", "Request a quote"))
page("shop.html", "Shop", shop)

# mezuzahs.html and apparel.html are intentionally gone. They hardcoded old category names
# ("Mezuzahs", "Apparel & Gifts") that no longer exist since the categories were renamed in the
# admin, so both pages rendered empty. category.html handles every category from the config.

# ---- Generic category page (reads ?c=<category>) ----
category = ('<div class="page-hero"><span class="ey">Collection</span>'
            '<h1 id="cat-title"></h1>'
            '<script>(function(){var c=new URLSearchParams(location.search).get("c");'
            'if(c){document.getElementById("cat-title").textContent=c;'
            'document.title=c+" | Bitachon Judaica";}})();</script>'
            '<div class="divider"></div></div>'
            '<section><div class="wrap">'
            '<div id="search" class="searchwrap"></div>'
            '<nav id="catnav" class="catnav"></nav>'
            '<div id="products" class="cats"></div>'
            '</div></section>'
            '<script src="/assets/store.js?v=20261022-compact"></script>'
            '<script>BJStore.renderSearch("search");'
            'BJStore.renderFromQuery("products","cat-title");'
            'BJStore.renderCats("catnav", new URLSearchParams(location.search).get("c"))</script>')
page("category.html", "Shop", category)

# ---- About (headline + paragraphs come from editable config) ----
about = """
<div class="page-hero" style="padding-top:26px"><span class="ey">Our Story</span><h1 id="about-quote">It began on my mirror</h1><div class="divider"></div></div>
<div class="prose">
  <div id="about-body">
    <p>Every morning I would wake up and write a few words where I would see them first thing: don't worry, Hashem knows what to do. Those little reminders carried me through hard mornings, and slowly they became something I wanted to share.</p>
    <p>Bitachon means knowing that Hashem is always there. That He created us, watches our every step, and knows everything before it happens. When you have bitachon, you don't have to worry, because even the hard is good. It is a lesson Hashem wants us to learn, and He is holding our hand through all of it.</p>
    <p>I shape every piece myself, from a lump of clay to a finished blessing for your home. No two are ever quite the same. My hope is simple: that each piece helps you remember Hashem and feel that He is with you.</p>
  </div>
  <p class="center" style="color:#2B5C99;font-family:'Playfair Display',serif;font-size:22px;margin-top:36px">Trust in Hashem.</p>

</div>

<script>fetch((window.BJ_API||"")+"/api/config").then(function(r){return r.json()}).then(function(c){
  var a=c.about||{}, ct=c.contact||{};
  /* A headline that is really a list of web addresses is the old bug, so ignore it and keep the real one. */
  if(a.quote && a.quote.indexOf("www.")===-1) document.getElementById("about-quote").textContent=a.quote;
  var ps=a.paragraphs||[];
  if(ps.length){document.getElementById("about-body").innerHTML=ps.map(function(p){return "<p>"+p.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</p>"}).join("")}
}).catch(function(){});</script>
"""
page("about.html", "Our Story", about)

# ---- Bulk ----
bulk = hero("Schools, Shuls &amp; Organizations", "Bulk &amp; Custom Orders",
            "Custom tees and gifts for your group, in any quantity.") + """
<div class="prose">
  <p>Outfitting a school, shul, camp, or organization? We produce custom apparel and gifts in any size run, with personal guidance from the first idea to the final box. Tell us what you are celebrating and we will make it simple.</p>
</div>
<div class="btn-row"><a class="btn" href="/contact.html">Request a Quote</a></div>
"""
page("bulk.html", "Bulk & Custom Orders", bulk)

# ---- Shipping ----
ship = hero("Help", "Shipping &amp; Returns") + """
<div class="prose">
  <h2>Shipping</h2>
  <p>We ship worldwide. Because every piece is handmade, please allow time for your order to be prepared with care before it ships. You will receive tracking once it is on its way.</p>
  <h2>Handmade, one of a kind</h2>
  <p>Small variations are part of the beauty of handcrafted work and are not defects. Each piece is unique.</p>
  <h2>Returns</h2>
  <p>If something arrives damaged, reach out within seven days and we will make it right.</p>
</div>
<div class="btn-row"><a class="btn" href="/contact.html">Questions? Contact us</a></div>
"""
page("shipping.html", "Shipping & Returns", ship)

# ---- Contact (intro/phone come from editable config) ----
contact = """
<div class="page-hero"><span class="ey">Get in Touch</span><h1>Contact</h1><p id="c-intro">We would love to hear from you.</p><div class="divider"></div></div>
<div id="c-block" class="center" style="max-width:560px;margin:0 auto 6px;color:#3a4452"></div>
<script>fetch((window.BJ_API||"")+"/api/config").then(function(r){return r.json()}).then(function(c){var ct=c.contact||{};if(ct.intro)document.getElementById("c-intro").textContent=ct.intro;var b="";if(ct.phone)b+='<p style="font-family:\\'Playfair Display\\',serif;font-size:20px"><a style="color:#2B5C99" href="'+(ct.phoneHref||("tel:"+ct.phone))+'">'+ct.phone+"</a></p>";if(ct.subtext)b+="<p>"+ct.subtext+"</p>";document.getElementById("c-block").innerHTML=b;}).catch(function(){});</script>
""" + """
<form class="form" id="cform">
  <label>Name</label><input type="text" id="cf_name" placeholder="Your name" required>
  <label>Email</label><input type="email" id="cf_email" placeholder="you@email.com" required>
  <label>Message</label><textarea id="cf_msg" placeholder="Tell us what you are looking for" required></textarea>
  <div class="center"><button type="submit">Send Message</button></div>
  <p class="alt">This opens your email app with the message ready to send, or write to
    <a style="color:#2B5C99" href="mailto:bitachonjudaica@gmail.com">bitachonjudaica@gmail.com</a>.</p>
</form>
<script>
/* ponytail: hands the message to the visitor's own email app. No mail server to run or pay for.
   Swap for a real form service if visitors without a mail app start dropping off. */
document.getElementById("cform").addEventListener("submit", function(e){
  e.preventDefault();
  var n=document.getElementById("cf_name").value.trim(),
      m=document.getElementById("cf_msg").value.trim(),
      r=document.getElementById("cf_email").value.trim();
  var body=m+"\\n\\n"+n+(r?"\\n"+r:"");
  location.href="mailto:bitachonjudaica@gmail.com?subject="+encodeURIComponent("Website message from "+n)+"&body="+encodeURIComponent(body);
});
</script>
"""
page("contact.html", "Contact", contact)

print("done")


page("cart.html", "Your cart", """
<div class="wrap cart-page">
  <p class="ey">A little something meaningful</p>
  <h1>Your shopping cart</h1>
  <p class="cart-intro">Gather your favorites, then call us to place your order.</p>
  <div id="cart-content" aria-live="polite"></div>
  <noscript>Please enable JavaScript to use your cart, or call (224) 645-2752 to order.</noscript>
</div>
""")






















