-- Kiln & Thread — seed data
-- Run after schema.sql: psql -U youruser -d kilnthread -f seed.sql

INSERT INTO makers (name, slug, bio, location) VALUES
  ('Alder Clayworks', 'alder-clayworks', 'A small stoneware studio throwing tableware in batches of a dozen at a time.', 'Asheville, NC'),
  ('Fen & Reed', 'fen-and-reed', 'Willow basketry using reeds coppiced from a family plot.', 'Somerset, UK'),
  ('Norra Textiles', 'norra-textiles', 'Floor-loom weaving in undyed, natural-fibre wool and cotton.', 'Portland, OR'),
  ('Birch & Saw', 'birch-and-saw', 'End-grain and live-edge woodworking, finished with food-safe oils.', 'Burlington, VT'),
  ('Hollow Hive', 'hollow-hive', 'Small-batch beeswax and soy candles poured by hand.', 'Austin, TX'),
  ('Marrow Leather Co.', 'marrow-leather-co', 'Waxed canvas and full-grain leather goods made to age well.', 'Minneapolis, MN');

INSERT INTO categories (name, slug) VALUES
  ('Ceramics', 'ceramics'),
  ('Woven', 'woven'),
  ('Woodwork', 'woodwork'),
  ('Candles', 'candles'),
  ('Leather', 'leather');

-- maker_id / category_id below reference the insert order above (1-indexed)
INSERT INTO products (slug, name, maker_id, category_id, price_cents, material, description, maker_quote, photo_url, stock_qty) VALUES
  ('speckled-stoneware-bowl', 'Speckled Stoneware Bowl', 1, 1, 4800, 'Stoneware, food-safe glaze',
    'Wheel-thrown from a flecked stoneware clay, finished with a matte oat glaze. Microwave and dishwasher safe.',
    'Every bowl comes out a little different — the speckles are iron in the clay, not paint.',
    'https://images.unsplash.com/photo-1546938576-8219ca96ffb5', 24),

  ('terracotta-pour-over-mug', 'Terracotta Pour-Over Mug', 1, 1, 3200, 'Terracotta, lead-free glaze',
    'A single-origin mug with a thumb rest and a glaze that darkens slightly with every use.',
    'I make these in batches of twelve so no two months look quite the same.',
    'https://images.unsplash.com/photo-1628149588806-04e41a81a945', 30),

  ('river-stone-vase', 'River Stone Vase', 1, 1, 6400, 'Stoneware',
    'A tall, narrow vase inspired by riverbed stones, hand-shaped without a wheel.',
    'I press each one with my palms — you can still feel the shape of my hands in the base.',
    'https://images.unsplash.com/photo-1699662051194-3ad962273048', 12),

  ('willow-market-basket', 'Willow Market Basket', 2, 2, 5600, 'Willow',
    'Hand-woven willow basket with a fixed handle, sized for market runs or bread proofing.',
    'The willow is coppiced from a family plot and dried for six months before weaving.',
    'https://images.unsplash.com/photo-1586975471851-06fbf8453bda', 18),

  ('undyed-wool-throw', 'Undyed Wool Throw', 3, 2, 11800, '100% undyed wool',
    'A heavy wool throw woven on a floor loom, left undyed to show the natural fleece colour.',
    'It takes about fourteen hours on the loom, start to finish.',
    'https://images.unsplash.com/photo-1731399211410-e3ffe1560310', 9),

  ('cotton-macrame-hanging', 'Cotton Macrame Hanging', 3, 2, 7400, 'Cotton cord, driftwood dowel',
    'A knotted wall hanging in undyed cotton cord, roughly 60cm wide.',
    'Macrame is just knots repeated with patience — nothing more complicated than that.',
    'https://images.unsplash.com/photo-1619808799783-db68de98fbe0', 15),

  ('walnut-cutting-board', 'Walnut Cutting Board', 4, 3, 8600, 'Black walnut, beeswax finish',
    'End-grain walnut board, finished with food-safe mineral oil and beeswax.',
    'End-grain is kinder to your knives — the fibres close back up after every cut.',
    'https://images.unsplash.com/photo-1685022056255-523278bf43ec', 20),

  ('oak-serving-board', 'Oak Serving Board', 4, 3, 5200, 'White oak',
    'A long oak board for cheese or bread, with a live edge on one side.',
    'I leave one edge natural so you can still see the tree it came from.',
    'https://images.unsplash.com/photo-1685022056255-523278bf43ec', 22),

  ('beeswax-taper-set', 'Beeswax Taper Set', 5, 4, 2600, 'Pure beeswax',
    'A pair of hand-dipped beeswax tapers, slow-burning with a faint honey scent.',
    'Beeswax burns almost twice as long as paraffin — and it doesn''t smoke.',
    'https://images.unsplash.com/photo-1631624401804-9654cc83aabc', 40),

  ('cedar-clove-candle', 'Cedar & Clove Candle', 5, 4, 3400, 'Soy wax, stoneware vessel',
    'Poured in small batches with soy wax and a cotton wick, in a reusable stoneware vessel.',
    'I test every scent on my own mantelpiece before it goes in the shop.',
    'https://images.unsplash.com/photo-1631624401804-9654cc83aabc', 35),

  ('waxed-canvas-tote', 'Waxed Canvas Tote', 6, 5, 9200, 'Waxed canvas, leather',
    'A waxed canvas tote with full-grain leather straps that darken with age.',
    'Give it a year outdoors and the wax finish will look completely different — that''s the idea.',
    'https://images.unsplash.com/photo-1766634001794-b3003f486954', 14),

  ('slate-dinner-plate-set', 'Slate Dinner Plate Set', 1, 1, 9600, 'Stoneware, slate glaze',
    'A set of two hand-thrown dinner plates in a soft slate glaze.',
    'I throw these on the slower wheel setting — it keeps the rims from warping.',
    'https://images.unsplash.com/photo-1587306768727-45977dc859cc', 16);
