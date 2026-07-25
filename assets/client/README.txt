Client-work images
------------------
Drop your JPG/PNG files in this folder, then list them in index.html.

Find this block near the bottom of index.html (inside the <script> tag):

  tiles = [
    ['couture-01.jpg', 'Haute Couture Runway'],
    ['campaign-01.jpg', 'Commercial Campaign'],
    ['still-01.jpg', ''],
    ...
  ]

Each row is ['filename.jpg', 'Optional caption'].
Empty caption = no text overlay on the tile.
Add or remove rows freely - the grid reflows automatically.

Recommended: export at 1200px on the long edge, ~200KB each.
Any file that is missing shows a striped placeholder with its filename.
