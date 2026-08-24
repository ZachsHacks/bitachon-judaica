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
<link rel="stylesheet" href="/assets/site.css">
<script>/* On the live site read our own API. Anywhere else (Vercel preview, localhost) read the
live API so previews show the real products. */
window.BJ_API=/(^|\\.)bitachonjudaica\\.com$/.test(location.hostname)?"":"https://bitachonjudaica.com";</script>
</head>
<body>
<header>
  <div class="topbar">
    <a href="/" class="logo brand"><img class="logo-img" src="/assets/logo.png" alt="Bitachon Judaica"><span class="brand-text">Bitachon Judaica</span></a>
    <nav><ul>
      <li><a href="/shop.html">Shop</a></li>
      <li><a href="/mezuzahs.html">Mezuzahs</a></li>
      <li><a href="/apparel.html">Apparel</a></li>
      <li><a href="/about.html">About</a></li>
    </ul></nav>
    <div class="icons">Cart (0)</div>
  </div>
</header>
<main>
"""

FOOT = """</main>
<footer>
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

def page(filename, title, body):
    with open(os.path.join(OUT, filename), "w") as f:
        f.write(HEAD.format(title=title) + body + FOOT)
    print("wrote", filename)

def hero(ey, h1, sub=""):
    p = f'<p>{sub}</p>' if sub else ''
    return (f'<div class="page-hero"><span class="ey">{ey}</span><h1>{h1}</h1>'
            f'{p}<div class="divider"></div></div>')

def grid(category):
    arg = "null" if category is None else '"' + category.replace('"', '\\"') + '"'
    return ('<section><div class="wrap shoplayout">'
            '<aside id="catnav" class="catnav"></aside>'
            '<div id="products" class="cats"></div>'
            '</div></section>'
            '<script src="/assets/store.js"></script>'
            f'<script>BJStore.render("products", {arg});BJStore.renderCats("catnav", {arg})</script>')

def band(ey, h2, href, label):
    return f'<div class="band"><div class="wrap"><span class="ey">{ey}</span><h2>{h2}</h2><a href="{href}">{label}</a></div></div>'

# ---- Shop (all products + dynamic category nav) ----
shop = ('<div class="page-hero"><span class="ey">The Collections</span>'
        '<h1 id="cat-title">Shop</h1>'
        '<p>Handcrafted Judaica, made one piece at a time.</p>'
        '<div class="divider"></div></div>'
        + grid(None)
        + band("For schools &amp; groups", "Bulk &amp; custom orders", "/bulk.html", "Request a quote"))
page("shop.html", "Shop", shop)

# ---- Mezuzahs ----
mez = (hero("Collection", "Mezuzahs", "Handmade mezuzah cases for every doorway in your home.")
       + grid("Mezuzahs")
       + band("Made to order", "Reach out to commission a mezuzah", "/contact.html", "Get in touch"))
page("mezuzahs.html", "Mezuzahs", mez)

# ---- Apparel ----
app = (hero("Collection", "Apparel &amp; Gifts", "Tees, hats, and everyday pieces that carry the message.")
       + grid("Apparel & Gifts")
       + band("Schools &amp; groups welcome", "Ask about a custom run", "/bulk.html", "Bulk &amp; custom orders"))
page("apparel.html", "Apparel & Gifts", app)

# ---- Generic category page (reads ?c=<category>) ----
category = ('<div class="page-hero"><span class="ey">Collection</span>'
            '<h1 id="cat-title"></h1>'
            '<script>(function(){var c=new URLSearchParams(location.search).get("c");'
            'if(c){document.getElementById("cat-title").textContent=c;'
            'document.title=c+" | Bitachon Judaica";}})();</script>'
            '<div class="divider"></div></div>'
            '<section><div class="wrap shoplayout">'
            '<aside id="catnav" class="catnav"></aside>'
            '<div id="products" class="cats"></div>'
            '</div></section>'
            '<script src="/assets/store.js"></script>'
            '<script>BJStore.renderFromQuery("products","cat-title");'
            'BJStore.renderCats("catnav", new URLSearchParams(location.search).get("c"))</script>')
page("category.html", "Shop", category)

# ---- About (headline + paragraphs come from editable config) ----
about = """
<div class="page-hero"><span class="ey">Our Story</span><h1 id="about-quote">It began on my mirror</h1><div class="divider"></div></div>
<div class="prose">
  <img src="/assets/signs2.jpg" alt="Handmade bitachon signs">
  <div id="about-body">
    <p>Every morning I would wake up and write a few words where I would see them first thing: don't worry, Hashem knows what to do. Those little reminders carried me through hard mornings, and slowly they became something I wanted to share.</p>
    <p>Bitachon means knowing that Hashem is always there. That He created us, watches our every step, and knows everything before it happens. When you have bitachon, you don't have to worry, because even the hard is good. It is a lesson Hashem wants us to learn, and He is holding our hand through all of it.</p>
    <p>I shape every piece myself, from a lump of clay to a finished blessing for your home. No two are ever quite the same. My hope is simple: that each piece helps you remember Hashem and feel that He is with you.</p>
  </div>
  <p class="center" style="color:#2B5C99;font-family:'Playfair Display',serif;font-size:22px;margin-top:36px">Trust in Hashem.</p>
</div>
<div class="btn-row"><a class="btn" href="/shop.html">Explore the Collection</a></div>
<script>fetch((window.BJ_API||"")+"/api/config").then(function(r){return r.json()}).then(function(c){if(c.about){if(c.about.quote)document.getElementById("about-quote").textContent=c.about.quote;var ps=c.about.paragraphs||[];if(ps.length){document.getElementById("about-body").innerHTML=ps.map(function(p){return "<p>"+p.replace(/&/g,"&amp;").replace(/</g,"&lt;")+"</p>"}).join("")}}}).catch(function(){});</script>
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
<form class="form" onsubmit="return false">
  <label>Name</label><input type="text" placeholder="Your name">
  <label>Email</label><input type="email" placeholder="you@email.com">
  <label>Message</label><textarea placeholder="Tell us what you are looking for"></textarea>
  <div class="center"><button>Send Message</button></div>
  <p class="alt">This form is not connected yet. We will wire it to your inbox before launch.</p>
</form>
"""
page("contact.html", "Contact", contact)

print("done")
