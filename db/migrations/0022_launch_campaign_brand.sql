-- The launch campaign's small line still said the old name (BE-191 renamed the brand to Chillwaa).
update app.campaigns set eyebrow = replace(eyebrow, 'Chill & Connect', 'Chillwaa') where eyebrow like '%Chill & Connect%';
