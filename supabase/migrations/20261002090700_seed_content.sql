-- ─────────────────────────────────────────────────────────────────────────────
-- 011 · Seed: the site's current content
--
-- Loads what the site shows today into the database, so it looks the same
-- after the switch and everything becomes editable in the studio:
--   6 instructors, 16 published courses (+ 2 studio drafts) with their curricula,
--   16 blog posts (+ 1 draft), 7 challenges and the site settings.
--
-- Generated from lib/content.ts, lib/curriculum.ts, lib/articles, lib/challenges.ts
-- and lib/site-settings.ts. Safe to re-run: rows that already exist (matched by
-- slug) are left alone, so studio edits are never overwritten.
--
-- Requires 004–008.
-- ─────────────────────────────────────────────────────────────────────────────

begin;

-- Instructors ───────────────────────────────────────────────────────────────

insert into public.instructors (slug, name, specialty, bio, image, email, position) values
  ('marcus-reid', 'Marcus Reid', 'Scratch & Turntablism', 'Marcus is a turntablist and club DJ who believes every DJ should be able to mix by ear. He teaches scratching, beatmatching and the fundamentals that make everything else easier.', '/images/instructors/marcus-reid.jpg', 'marcus.reid@ultimatedeejays.com', 0),
  ('sofia-martins', 'Sofia Martins', 'Music Production', 'Sofia is a producer and DJ who makes edits and originals for her own sets. She teaches production with one goal: music that works on a dance floor.', '/images/instructors/sofia-martins.jpg', 'sofia.martins@ultimatedeejays.com', 1),
  ('daniel-mensah', 'Daniel Mensah', 'Afrobeats & Amapiano', 'Daniel plays Afrobeats and amapiano for clubs and events, and is known for long, patient blends that keep the floor moving all night.', '/images/instructors/daniel-mensah.jpg', 'daniel.mensah@ultimatedeejays.com', 2),
  ('amara-okafor', 'Amara Okafor', 'Open-Format & Events', 'Amara is an open-format and wedding DJ who teaches the business side of DJing, from pitching promoters to running a flawless event.', '/images/instructors/amara-okafor.jpg', 'amara.okafor@ultimatedeejays.com', 3),
  ('leo-moreno', 'Leo Moreno', 'House & Techno', 'Leo is a house and techno DJ who cares about clean mixes, careful gain staging and healthy ears, in that order.', '/images/instructors/leo-moreno.jpg', 'leo.moreno@ultimatedeejays.com', 4),
  ('mei-tanaka', 'Mei Tanaka', 'Serato & Controllers', 'Mei specializes in Serato and DJ controllers, and helps new DJs choose the right gear and get the most out of it.', '/images/instructors/mei-tanaka.jpg', 'mei.tanaka@ultimatedeejays.com', 5)
on conflict (slug) do nothing;

-- Courses ───────────────────────────────────────────────────────────────────

-- DJ Fundamentals: Beatmatching & Your First Mix
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'dj-fundamentals', 'DJ Fundamentals: Beatmatching & Your First Mix', 'Learn how a DJ setup works, beatmatch by ear, count phrases and blend two tracks cleanly, then record a confident first mix you''re proud to share.', 'Learn how a DJ setup works, beatmatch by ear, count phrases and blend two tracks cleanly, then record a confident first mix you''re proud to share.

Every lesson is taught by Marcus Reid, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'fundamentals', '', 'Beginner', 'English', 'warm-up', '/images/courses/dj-fundamentals.jpg',
  'https://youtu.be/8LWLJF7i8ZI', array['Beatmatching by ear: the two-minute version', 'Your first beatmatch in five steps', 'Beatmatching, step by step', 'Train your ears: mixing without the screen', 'Phrasing: mix on the right bar']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['Complete beginners who want to learn to DJ properly from day one']::text[], false, 'published', (select id from public.instructors where slug = 'marcus-reid'), 860,
  1284, 4.9, 412, '2025-09-15T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('dj-fundamentals-getting-started', 'Getting started', 0),
  ('dj-fundamentals-beatmatching', 'Beatmatching', 1),
  ('dj-fundamentals-your-first-mix', 'Your first mix', 2)
) as v(id, title, position)
where c.slug = 'dj-fundamentals'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('dj-fundamentals-beatmatch-by-ear-quick', 'dj-fundamentals-getting-started', 'beatmatch-by-ear-quick', 'Beatmatching by ear: the two-minute version', 'The whole idea of beatmatching by ear in two minutes, so you know exactly what you''re listening for before you practice.', 'https://youtu.be/8LWLJF7i8ZI', 120, true, 'Club Ready DJ School', 0),
  ('dj-fundamentals-first-beatmatch', 'dj-fundamentals-getting-started', 'first-beatmatch', 'Your first beatmatch in five steps', 'A practical walkthrough of getting two tracks playing in time: cueing the downbeat, starting the new track on the one, and matching tempo with the pitch fader.', 'https://www.youtube.com/watch?v=ASUiL2pJp7w', 456, false, 'DJ Phil Harris', 1),
  ('dj-fundamentals-beatmatching-step-by-step', 'dj-fundamentals-beatmatching', 'beatmatching-step-by-step', 'Beatmatching, step by step', 'A slower, detailed look at beatmatching: hearing which track is faster, making small pitch adjustments and nudging the jog wheel until the kicks lock.', 'https://www.youtube.com/watch?v=F6c62PKj-Ns', 1126, true, 'P4NTH3R', 0),
  ('dj-fundamentals-mix-without-the-screen', 'dj-fundamentals-beatmatching', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, false, 'Club Ready DJ School', 1),
  ('dj-fundamentals-phrase-mixing', 'dj-fundamentals-your-first-mix', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('dj-fundamentals-eq-essentials', 'dj-fundamentals-your-first-mix', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 1),
  ('dj-fundamentals-transitions-masterclass', 'dj-fundamentals-your-first-mix', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, false, 'Club Ready DJ School', 2)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'dj-fundamentals'
on conflict (course_id, id) do nothing;

-- Serato DJ Pro Masterclass: From Setup to Stage
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'serato-dj-pro-masterclass', 'Serato DJ Pro Masterclass: From Setup to Stage', 'Set up Serato DJ Pro, build a crate system that scales, and master hot cues, loops, effects and recording on any Serato-compatible controller.', 'Set up Serato DJ Pro, build a crate system that scales, and master hot cues, loops, effects and recording on any Serato-compatible controller.

Every lesson is taught by Mei Tanaka, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'software-gear', 'serato', 'Beginner', 'English', 'resident', '/images/courses/serato-dj-pro-masterclass.jpg',
  'https://www.youtube.com/watch?v=p-D38xJH9Ko', array['Scratching in Serato: the basics', 'Record your scratches on a controller', 'Your first beatmatch in five steps', 'Beatmatching, step by step', 'EQ essentials for clean blends']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['Complete beginners who want to learn to DJ properly from day one']::text[], false, 'published', (select id from public.instructors where slug = 'mei-tanaka'), 705,
  963, 4.8, 287, '2025-10-20T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('serato-dj-pro-masterclass-setting-up', 'Setting up', 0),
  ('serato-dj-pro-masterclass-mixing-on-your-setup', 'Mixing on your setup', 1)
) as v(id, title, position)
where c.slug = 'serato-dj-pro-masterclass'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('serato-dj-pro-masterclass-scratching-in-serato', 'serato-dj-pro-masterclass-setting-up', 'scratching-in-serato', 'Scratching in Serato: the basics', 'Set up your controller for scratching in Serato and learn the first moves: hand position, the baby scratch and clean cuts.', 'https://www.youtube.com/watch?v=p-D38xJH9Ko', 421, true, 'DJ Blighty', 0),
  ('serato-dj-pro-masterclass-record-your-scratches', 'serato-dj-pro-masterclass-setting-up', 'record-your-scratches', 'Record your scratches on a controller', 'Creative ways to record your scratching on a controller with Serato, so you can review your technique and share your cuts.', 'https://www.youtube.com/watch?v=GEMlHyNFwao', 427, false, 'Kyle James Jezwinski', 1),
  ('serato-dj-pro-masterclass-first-beatmatch', 'serato-dj-pro-masterclass-mixing-on-your-setup', 'first-beatmatch', 'Your first beatmatch in five steps', 'A practical walkthrough of getting two tracks playing in time: cueing the downbeat, starting the new track on the one, and matching tempo with the pitch fader.', 'https://www.youtube.com/watch?v=ASUiL2pJp7w', 456, true, 'DJ Phil Harris', 0),
  ('serato-dj-pro-masterclass-beatmatching-step-by-step', 'serato-dj-pro-masterclass-mixing-on-your-setup', 'beatmatching-step-by-step', 'Beatmatching, step by step', 'A slower, detailed look at beatmatching: hearing which track is faster, making small pitch adjustments and nudging the jog wheel until the kicks lock.', 'https://www.youtube.com/watch?v=F6c62PKj-Ns', 1126, false, 'P4NTH3R', 1),
  ('serato-dj-pro-masterclass-eq-essentials', 'serato-dj-pro-masterclass-mixing-on-your-setup', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 2)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'serato-dj-pro-masterclass'
on conflict (course_id, id) do nothing;

-- rekordbox & CDJs: Get Club-Ready on Pro Gear
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'rekordbox-cdj-club-ready', 'rekordbox & CDJs: Get Club-Ready on Pro Gear', 'Prepare USB drives in rekordbox, set hot cues and memory cues, and walk into any booth confident on club-standard CDJs and mixers.', 'Prepare USB drives in rekordbox, set hot cues and memory cues, and walk into any booth confident on club-standard CDJs and mixers.

Every lesson is taught by Leo Moreno, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'software-gear', 'rekordbox', 'Intermediate', 'English', 'resident', '/images/courses/rekordbox-cdj-club-ready.jpg',
  'https://www.youtube.com/watch?v=p-D38xJH9Ko', array['Scratching in Serato: the basics', 'Record your scratches on a controller', 'Your first beatmatch in five steps', 'Beatmatching, step by step', 'EQ essentials for clean blends']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs who can beatmatch and want to sound more polished']::text[], false, 'published', (select id from public.instructors where slug = 'leo-moreno'), 570,
  842, 4.9, 231, '2025-11-18T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('rekordbox-cdj-club-ready-setting-up', 'Setting up', 0),
  ('rekordbox-cdj-club-ready-mixing-on-your-setup', 'Mixing on your setup', 1)
) as v(id, title, position)
where c.slug = 'rekordbox-cdj-club-ready'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('rekordbox-cdj-club-ready-scratching-in-serato', 'rekordbox-cdj-club-ready-setting-up', 'scratching-in-serato', 'Scratching in Serato: the basics', 'Set up your controller for scratching in Serato and learn the first moves: hand position, the baby scratch and clean cuts.', 'https://www.youtube.com/watch?v=p-D38xJH9Ko', 421, true, 'DJ Blighty', 0),
  ('rekordbox-cdj-club-ready-record-your-scratches', 'rekordbox-cdj-club-ready-setting-up', 'record-your-scratches', 'Record your scratches on a controller', 'Creative ways to record your scratching on a controller with Serato, so you can review your technique and share your cuts.', 'https://www.youtube.com/watch?v=GEMlHyNFwao', 427, false, 'Kyle James Jezwinski', 1),
  ('rekordbox-cdj-club-ready-first-beatmatch', 'rekordbox-cdj-club-ready-mixing-on-your-setup', 'first-beatmatch', 'Your first beatmatch in five steps', 'A practical walkthrough of getting two tracks playing in time: cueing the downbeat, starting the new track on the one, and matching tempo with the pitch fader.', 'https://www.youtube.com/watch?v=ASUiL2pJp7w', 456, true, 'DJ Phil Harris', 0),
  ('rekordbox-cdj-club-ready-beatmatching-step-by-step', 'rekordbox-cdj-club-ready-mixing-on-your-setup', 'beatmatching-step-by-step', 'Beatmatching, step by step', 'A slower, detailed look at beatmatching: hearing which track is faster, making small pitch adjustments and nudging the jog wheel until the kicks lock.', 'https://www.youtube.com/watch?v=F6c62PKj-Ns', 1126, false, 'P4NTH3R', 1),
  ('rekordbox-cdj-club-ready-eq-essentials', 'rekordbox-cdj-club-ready-mixing-on-your-setup', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 2)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'rekordbox-cdj-club-ready'
on conflict (course_id, id) do nothing;

-- Scratch School: From Baby Scratch to Flares
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'scratch-school', 'Scratch School: From Baby Scratch to Flares', 'Build real scratch technique step by step, from baby scratches and chops to transforms and flares, with drills you can practice on any setup.', 'Build real scratch technique step by step, from baby scratches and chops to transforms and flares, with drills you can practice on any setup.

Every lesson is taught by Marcus Reid, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'scratch', '', 'Intermediate', 'English', 'resident', '/images/courses/scratch-school.jpg',
  'https://www.youtube.com/watch?v=p-D38xJH9Ko', array['Scratching in Serato: the basics', 'Record your scratches on a controller', 'Build a scratch tool in Ableton Live']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs who can beatmatch and want to sound more polished']::text[], false, 'published', (select id from public.instructors where slug = 'marcus-reid'), 495,
  611, 4.8, 176, '2025-12-10T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('scratch-school-scratch-basics', 'Scratch basics', 0),
  ('scratch-school-practice-and-recording', 'Practice and recording', 1),
  ('scratch-school-scratching-in-production', 'Scratching in production', 2)
) as v(id, title, position)
where c.slug = 'scratch-school'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('scratch-school-scratching-in-serato', 'scratch-school-scratch-basics', 'scratching-in-serato', 'Scratching in Serato: the basics', 'Set up your controller for scratching in Serato and learn the first moves: hand position, the baby scratch and clean cuts.', 'https://www.youtube.com/watch?v=p-D38xJH9Ko', 421, true, 'DJ Blighty', 0),
  ('scratch-school-record-your-scratches', 'scratch-school-practice-and-recording', 'record-your-scratches', 'Record your scratches on a controller', 'Creative ways to record your scratching on a controller with Serato, so you can review your technique and share your cuts.', 'https://www.youtube.com/watch?v=GEMlHyNFwao', 427, true, 'Kyle James Jezwinski', 0),
  ('scratch-school-ableton-scratch-tool', 'scratch-school-scratching-in-production', 'ableton-scratch-tool', 'Build a scratch tool in Ableton Live', 'Bring DJ technique into production: build a scratch tool in Ableton Live and use it alongside Serato.', 'https://www.youtube.com/watch?v=cOtcWU6bL8g', 2029, true, 'Pointblank Music School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'scratch-school'
on conflict (course_id, id) do nothing;

-- Afrobeats & Amapiano Mixing Blueprint
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'afrobeats-amapiano-mixing', 'Afrobeats & Amapiano Mixing Blueprint', 'Mix Afrobeats and amapiano with long, patient blends, clean log drum swaps and smooth tempo changes that keep the whole room moving.', 'Mix Afrobeats and amapiano with long, patient blends, clean log drum swaps and smooth tempo changes that keep the whole room moving.

Every lesson is taught by Daniel Mensah, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'genres', 'afrobeats-amapiano', 'Intermediate', 'English', 'resident', '/images/courses/afrobeats-amapiano-mixing.jpg',
  'https://www.youtube.com/watch?v=_O-yX9MnGMw', array['Phrasing: mix on the right bar', 'EQ essentials for clean blends', 'Transitions masterclass: phrasing, EQ & filters', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs who can beatmatch and want to sound more polished']::text[], false, 'published', (select id from public.instructors where slug = 'daniel-mensah'), 460,
  1027, 4.9, 305, '2026-01-14T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('afrobeats-amapiano-mixing-groove-and-structure', 'Groove and structure', 0),
  ('afrobeats-amapiano-mixing-long-blends', 'Long blends', 1),
  ('afrobeats-amapiano-mixing-playing-by-ear', 'Playing by ear', 2)
) as v(id, title, position)
where c.slug = 'afrobeats-amapiano-mixing'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('afrobeats-amapiano-mixing-phrase-mixing', 'afrobeats-amapiano-mixing-groove-and-structure', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('afrobeats-amapiano-mixing-eq-essentials', 'afrobeats-amapiano-mixing-groove-and-structure', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 1),
  ('afrobeats-amapiano-mixing-transitions-masterclass', 'afrobeats-amapiano-mixing-long-blends', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, true, 'Club Ready DJ School', 0),
  ('afrobeats-amapiano-mixing-mix-without-the-screen', 'afrobeats-amapiano-mixing-playing-by-ear', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, true, 'Club Ready DJ School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'afrobeats-amapiano-mixing'
on conflict (course_id, id) do nothing;

-- Harmonic Mixing: Mix in Key Like a Pro
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'harmonic-mixing', 'Harmonic Mixing: Mix in Key Like a Pro', 'Use key detection and the Camelot wheel to plan blends that sound musical, lift the energy with key changes and avoid clashes.', 'Use key detection and the Camelot wheel to plan blends that sound musical, lift the energy with key changes and avoid clashes.

Every lesson is taught by Leo Moreno, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'mixing', '', 'Intermediate', 'English', 'resident', '/images/courses/harmonic-mixing.jpg',
  'https://www.youtube.com/watch?v=_O-yX9MnGMw', array['Phrasing: mix on the right bar', 'EQ essentials for clean blends', 'Transitions masterclass: phrasing, EQ & filters', 'Beatmatching by ear: the two-minute version', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs who can beatmatch and want to sound more polished']::text[], false, 'published', (select id from public.instructors where slug = 'leo-moreno'), 310,
  538, 4.7, 142, '2026-02-11T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('harmonic-mixing-song-structure', 'Song structure', 0),
  ('harmonic-mixing-eq-and-blending', 'EQ and blending', 1),
  ('harmonic-mixing-ear-training', 'Ear training', 2)
) as v(id, title, position)
where c.slug = 'harmonic-mixing'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('harmonic-mixing-phrase-mixing', 'harmonic-mixing-song-structure', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('harmonic-mixing-eq-essentials', 'harmonic-mixing-eq-and-blending', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, true, 'Soundflow Music Academy', 0),
  ('harmonic-mixing-transitions-masterclass', 'harmonic-mixing-eq-and-blending', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, false, 'Club Ready DJ School', 1),
  ('harmonic-mixing-beatmatch-by-ear-quick', 'harmonic-mixing-ear-training', 'beatmatch-by-ear-quick', 'Beatmatching by ear: the two-minute version', 'The whole idea of beatmatching by ear in two minutes, so you know exactly what you''re listening for before you practice.', 'https://youtu.be/8LWLJF7i8ZI', 120, true, 'Club Ready DJ School', 0),
  ('harmonic-mixing-mix-without-the-screen', 'harmonic-mixing-ear-training', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, false, 'Club Ready DJ School', 1)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'harmonic-mixing'
on conflict (course_id, id) do nothing;

-- Music Production for DJs in Ableton Live
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'ableton-production-for-djs', 'Music Production for DJs in Ableton Live', 'Go from DJ to producer in Ableton Live: make edits, build DJ-friendly intros and outros, and finish your first original track.', 'Go from DJ to producer in Ableton Live: make edits, build DJ-friendly intros and outros, and finish your first original track.

Every lesson is taught by Sofia Martins, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'production', '', 'Beginner', 'English', 'resident', '/images/courses/ableton-production-for-djs.jpg',
  'https://www.youtube.com/watch?v=_O-yX9MnGMw', array['Phrasing: mix on the right bar', 'Build a scratch tool in Ableton Live', 'Record your scratches on a controller']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['Complete beginners who want to learn to DJ properly from day one']::text[], false, 'published', (select id from public.instructors where slug = 'sofia-martins'), 965,
  704, 4.8, 198, '2026-03-12T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('ableton-production-for-djs-arrangement-for-djs', 'Arrangement for DJs', 0),
  ('ableton-production-for-djs-production-tools', 'Production tools', 1)
) as v(id, title, position)
where c.slug = 'ableton-production-for-djs'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('ableton-production-for-djs-phrase-mixing', 'ableton-production-for-djs-arrangement-for-djs', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('ableton-production-for-djs-ableton-scratch-tool', 'ableton-production-for-djs-production-tools', 'ableton-scratch-tool', 'Build a scratch tool in Ableton Live', 'Bring DJ technique into production: build a scratch tool in Ableton Live and use it alongside Serato.', 'https://www.youtube.com/watch?v=cOtcWU6bL8g', 2029, true, 'Pointblank Music School', 0),
  ('ableton-production-for-djs-record-your-scratches', 'ableton-production-for-djs-production-tools', 'record-your-scratches', 'Record your scratches on a controller', 'Creative ways to record your scratching on a controller with Serato, so you can review your technique and share your cuts.', 'https://www.youtube.com/watch?v=GEMlHyNFwao', 427, false, 'Kyle James Jezwinski', 1)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'ableton-production-for-djs'
on conflict (course_id, id) do nothing;

-- Open-Format DJing: Hip-Hop, R&B & Top 40
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'open-format-djing', 'Open-Format DJing: Hip-Hop, R&B & Top 40', 'Move between hip-hop, R&B, Afrobeats and Top 40 without losing the room, with quick-mix techniques, edits and smart request handling.', 'Move between hip-hop, R&B, Afrobeats and Top 40 without losing the room, with quick-mix techniques, edits and smart request handling.

Every lesson is taught by Amara Okafor, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'genres', 'open-format', 'Intermediate', 'English', 'resident', '/images/courses/open-format-djing.jpg',
  'https://www.youtube.com/watch?v=_O-yX9MnGMw', array['Phrasing: mix on the right bar', 'EQ essentials for clean blends', 'Transitions masterclass: phrasing, EQ & filters', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs who can beatmatch and want to sound more polished']::text[], false, 'published', (select id from public.instructors where slug = 'amara-okafor'), 410,
  489, 4.8, 121, '2026-04-08T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('open-format-djing-groove-and-structure', 'Groove and structure', 0),
  ('open-format-djing-long-blends', 'Long blends', 1),
  ('open-format-djing-playing-by-ear', 'Playing by ear', 2)
) as v(id, title, position)
where c.slug = 'open-format-djing'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('open-format-djing-phrase-mixing', 'open-format-djing-groove-and-structure', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('open-format-djing-eq-essentials', 'open-format-djing-groove-and-structure', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 1),
  ('open-format-djing-transitions-masterclass', 'open-format-djing-long-blends', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, true, 'Club Ready DJ School', 0),
  ('open-format-djing-mix-without-the-screen', 'open-format-djing-playing-by-ear', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, true, 'Club Ready DJ School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'open-format-djing'
on conflict (course_id, id) do nothing;

-- Vinyl DJing: Needle Drops, Cueing & Record Care
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'vinyl-djing-essentials', 'Vinyl DJing: Needle Drops, Cueing & Record Care', 'Learn to DJ on real turntables: cueing by hand, needle drops, riding the pitch and looking after your records and stylus.', 'Learn to DJ on real turntables: cueing by hand, needle drops, riding the pitch and looking after your records and stylus.

Every lesson is taught by Marcus Reid, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'scratch', '', 'Beginner', 'English', 'resident', '/images/courses/vinyl-djing-essentials.jpg',
  'https://www.youtube.com/watch?v=p-D38xJH9Ko', array['Scratching in Serato: the basics', 'Record your scratches on a controller', 'Build a scratch tool in Ableton Live']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['Complete beginners who want to learn to DJ properly from day one']::text[], false, 'published', (select id from public.instructors where slug = 'marcus-reid'), 380,
  214, 4.8, 38, '2026-09-22T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('vinyl-djing-essentials-scratch-basics', 'Scratch basics', 0),
  ('vinyl-djing-essentials-practice-and-recording', 'Practice and recording', 1),
  ('vinyl-djing-essentials-scratching-in-production', 'Scratching in production', 2)
) as v(id, title, position)
where c.slug = 'vinyl-djing-essentials'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('vinyl-djing-essentials-scratching-in-serato', 'vinyl-djing-essentials-scratch-basics', 'scratching-in-serato', 'Scratching in Serato: the basics', 'Set up your controller for scratching in Serato and learn the first moves: hand position, the baby scratch and clean cuts.', 'https://www.youtube.com/watch?v=p-D38xJH9Ko', 421, true, 'DJ Blighty', 0),
  ('vinyl-djing-essentials-record-your-scratches', 'vinyl-djing-essentials-practice-and-recording', 'record-your-scratches', 'Record your scratches on a controller', 'Creative ways to record your scratching on a controller with Serato, so you can review your technique and share your cuts.', 'https://www.youtube.com/watch?v=GEMlHyNFwao', 427, true, 'Kyle James Jezwinski', 0),
  ('vinyl-djing-essentials-ableton-scratch-tool', 'vinyl-djing-essentials-scratching-in-production', 'ableton-scratch-tool', 'Build a scratch tool in Ableton Live', 'Bring DJ technique into production: build a scratch tool in Ableton Live and use it alongside Serato.', 'https://www.youtube.com/watch?v=cOtcWU6bL8g', 2029, true, 'Pointblank Music School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'vinyl-djing-essentials'
on conflict (course_id, id) do nothing;

-- Wedding & Event DJ: Run the Whole Night
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'wedding-event-dj', 'Wedding & Event DJ: Run the Whole Night', 'Plan and run weddings and private events from first dance to last song, including timelines, MC skills, announcements and backup gear.', 'Plan and run weddings and private events from first dance to last song, including timelines, MC skills, announcements and backup gear.

Every lesson is taught by Amara Okafor, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'branding-gigs', '', 'Intermediate', 'English', 'resident', '/images/courses/wedding-event-dj.jpg',
  'https://www.youtube.com/watch?v=ASUiL2pJp7w', array['Your first beatmatch in five steps', 'Phrasing: mix on the right bar', 'Transitions masterclass: phrasing, EQ & filters', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs who can beatmatch and want to sound more polished']::text[], false, 'published', (select id from public.instructors where slug = 'amara-okafor'), 475,
  186, 4.9, 41, '2026-09-08T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('wedding-event-dj-be-gig-ready', 'Be gig-ready', 0),
  ('wedding-event-dj-sound-professional', 'Sound professional', 1),
  ('wedding-event-dj-play-anywhere', 'Play anywhere', 2)
) as v(id, title, position)
where c.slug = 'wedding-event-dj'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('wedding-event-dj-first-beatmatch', 'wedding-event-dj-be-gig-ready', 'first-beatmatch', 'Your first beatmatch in five steps', 'A practical walkthrough of getting two tracks playing in time: cueing the downbeat, starting the new track on the one, and matching tempo with the pitch fader.', 'https://www.youtube.com/watch?v=ASUiL2pJp7w', 456, true, 'DJ Phil Harris', 0),
  ('wedding-event-dj-phrase-mixing', 'wedding-event-dj-be-gig-ready', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, false, 'Zeeshan Khamis', 1),
  ('wedding-event-dj-transitions-masterclass', 'wedding-event-dj-sound-professional', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, true, 'Club Ready DJ School', 0),
  ('wedding-event-dj-mix-without-the-screen', 'wedding-event-dj-play-anywhere', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, true, 'Club Ready DJ School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'wedding-event-dj'
on conflict (course_id, id) do nothing;

-- Reading the Crowd: Sets That Keep the Floor Full
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'reading-the-crowd', 'Reading the Crowd: Sets That Keep the Floor Full', 'Learn to read a dance floor, pick the right next track and shape the energy of a night, whether you''re opening or closing.', 'Learn to read a dance floor, pick the right next track and shape the energy of a night, whether you''re opening or closing.

Every lesson is taught by Daniel Mensah, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'performance', '', 'All Levels', 'English', 'resident', '/images/courses/reading-the-crowd.jpg',
  'https://www.youtube.com/watch?v=_O-yX9MnGMw', array['Phrasing: mix on the right bar', 'Transitions masterclass: phrasing, EQ & filters', 'EQ essentials for clean blends', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs of every level who want to improve their sets']::text[], false, 'published', (select id from public.instructors where slug = 'daniel-mensah'), 270,
  342, 4.9, 67, '2026-08-25T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('reading-the-crowd-planning-your-set', 'Planning your set', 0),
  ('reading-the-crowd-transitions-that-keep-the-floor', 'Transitions that keep the floor', 1),
  ('reading-the-crowd-trusting-your-ears', 'Trusting your ears', 2)
) as v(id, title, position)
where c.slug = 'reading-the-crowd'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('reading-the-crowd-phrase-mixing', 'reading-the-crowd-planning-your-set', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('reading-the-crowd-transitions-masterclass', 'reading-the-crowd-transitions-that-keep-the-floor', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, true, 'Club Ready DJ School', 0),
  ('reading-the-crowd-eq-essentials', 'reading-the-crowd-transitions-that-keep-the-floor', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 1),
  ('reading-the-crowd-mix-without-the-screen', 'reading-the-crowd-trusting-your-ears', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, true, 'Club Ready DJ School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'reading-the-crowd'
on conflict (course_id, id) do nothing;

-- House & Techno: Long Blends and Big Build-Ups
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'house-techno-mixing', 'House & Techno: Long Blends and Big Build-Ups', 'Master long blends, EQ control and tension-building in house and techno, from deep warm-ups to peak-time grooves.', 'Master long blends, EQ control and tension-building in house and techno, from deep warm-ups to peak-time grooves.

Every lesson is taught by Leo Moreno, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'genres', 'house-techno', 'Intermediate', 'English', 'resident', '/images/courses/house-techno-mixing.jpg',
  'https://www.youtube.com/watch?v=_O-yX9MnGMw', array['Phrasing: mix on the right bar', 'EQ essentials for clean blends', 'Transitions masterclass: phrasing, EQ & filters', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs who can beatmatch and want to sound more polished']::text[], false, 'published', (select id from public.instructors where slug = 'leo-moreno'), 520,
  258, 4.7, 49, '2026-08-11T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('house-techno-mixing-groove-and-structure', 'Groove and structure', 0),
  ('house-techno-mixing-long-blends', 'Long blends', 1),
  ('house-techno-mixing-playing-by-ear', 'Playing by ear', 2)
) as v(id, title, position)
where c.slug = 'house-techno-mixing'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('house-techno-mixing-phrase-mixing', 'house-techno-mixing-groove-and-structure', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('house-techno-mixing-eq-essentials', 'house-techno-mixing-groove-and-structure', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 1),
  ('house-techno-mixing-transitions-masterclass', 'house-techno-mixing-long-blends', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, true, 'Club Ready DJ School', 0),
  ('house-techno-mixing-mix-without-the-screen', 'house-techno-mixing-playing-by-ear', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, true, 'Club Ready DJ School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'house-techno-mixing'
on conflict (course_id, id) do nothing;

-- Controller DJing: Get the Most From Your First Setup
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'controller-djing', 'Controller DJing: Get the Most From Your First Setup', 'Get the most out of your first controller: layout, performance pads, loops and effects, plus the habits that carry over to club gear.', 'Get the most out of your first controller: layout, performance pads, loops and effects, plus the habits that carry over to club gear.

Every lesson is taught by Mei Tanaka, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'fundamentals', '', 'Beginner', 'English', 'resident', '/images/courses/controller-djing.jpg',
  'https://youtu.be/8LWLJF7i8ZI', array['Beatmatching by ear: the two-minute version', 'Your first beatmatch in five steps', 'Beatmatching, step by step', 'Train your ears: mixing without the screen', 'Phrasing: mix on the right bar']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['Complete beginners who want to learn to DJ properly from day one']::text[], false, 'published', (select id from public.instructors where slug = 'mei-tanaka'), 325,
  397, 4.8, 73, '2026-07-28T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('controller-djing-getting-started', 'Getting started', 0),
  ('controller-djing-beatmatching', 'Beatmatching', 1),
  ('controller-djing-your-first-mix', 'Your first mix', 2)
) as v(id, title, position)
where c.slug = 'controller-djing'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('controller-djing-beatmatch-by-ear-quick', 'controller-djing-getting-started', 'beatmatch-by-ear-quick', 'Beatmatching by ear: the two-minute version', 'The whole idea of beatmatching by ear in two minutes, so you know exactly what you''re listening for before you practice.', 'https://youtu.be/8LWLJF7i8ZI', 120, true, 'Club Ready DJ School', 0),
  ('controller-djing-first-beatmatch', 'controller-djing-getting-started', 'first-beatmatch', 'Your first beatmatch in five steps', 'A practical walkthrough of getting two tracks playing in time: cueing the downbeat, starting the new track on the one, and matching tempo with the pitch fader.', 'https://www.youtube.com/watch?v=ASUiL2pJp7w', 456, false, 'DJ Phil Harris', 1),
  ('controller-djing-beatmatching-step-by-step', 'controller-djing-beatmatching', 'beatmatching-step-by-step', 'Beatmatching, step by step', 'A slower, detailed look at beatmatching: hearing which track is faster, making small pitch adjustments and nudging the jog wheel until the kicks lock.', 'https://www.youtube.com/watch?v=F6c62PKj-Ns', 1126, true, 'P4NTH3R', 0),
  ('controller-djing-mix-without-the-screen', 'controller-djing-beatmatching', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, false, 'Club Ready DJ School', 1),
  ('controller-djing-phrase-mixing', 'controller-djing-your-first-mix', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('controller-djing-eq-essentials', 'controller-djing-your-first-mix', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 1),
  ('controller-djing-transitions-masterclass', 'controller-djing-your-first-mix', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, false, 'Club Ready DJ School', 2)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'controller-djing'
on conflict (course_id, id) do nothing;

-- Festival Sets: Energy, Drops & Big-Room Moments
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'festival-sets', 'Festival Sets: Energy, Drops & Big-Room Moments', 'Plan and perform big-stage sets with dramatic drops, clean edits and energy that carries across a crowd of thousands.', 'Plan and perform big-stage sets with dramatic drops, clean edits and energy that carries across a crowd of thousands.

Every lesson is taught by Daniel Mensah, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'performance', '', 'Advanced', 'English', 'headliner', '/images/courses/festival-sets.jpg',
  'https://www.youtube.com/watch?v=_O-yX9MnGMw', array['Phrasing: mix on the right bar', 'Transitions masterclass: phrasing, EQ & filters', 'EQ essentials for clean blends', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['Experienced DJs preparing for bigger stages']::text[], false, 'published', (select id from public.instructors where slug = 'daniel-mensah'), 370,
  129, 4.8, 22, '2026-07-14T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('festival-sets-planning-your-set', 'Planning your set', 0),
  ('festival-sets-transitions-that-keep-the-floor', 'Transitions that keep the floor', 1),
  ('festival-sets-trusting-your-ears', 'Trusting your ears', 2)
) as v(id, title, position)
where c.slug = 'festival-sets'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('festival-sets-phrase-mixing', 'festival-sets-planning-your-set', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('festival-sets-transitions-masterclass', 'festival-sets-transitions-that-keep-the-floor', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, true, 'Club Ready DJ School', 0),
  ('festival-sets-eq-essentials', 'festival-sets-transitions-that-keep-the-floor', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, false, 'Soundflow Music Academy', 1),
  ('festival-sets-mix-without-the-screen', 'festival-sets-trusting-your-ears', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, true, 'Club Ready DJ School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'festival-sets'
on conflict (course_id, id) do nothing;

-- Radio & Mixshow DJing: Talk-Ups and Tight Mixes
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'radio-mixshow-dj', 'Radio & Mixshow DJing: Talk-Ups and Tight Mixes', 'Build tight, high-energy mixshows for radio and streaming, with clean talk-ups, timed segments and precise quick mixes.', 'Build tight, high-energy mixshows for radio and streaming, with clean talk-ups, timed segments and precise quick mixes.

Every lesson is taught by Amara Okafor, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'mixing', '', 'Intermediate', 'English', 'resident', '/images/courses/radio-mixshow-dj.jpg',
  'https://www.youtube.com/watch?v=_O-yX9MnGMw', array['Phrasing: mix on the right bar', 'EQ essentials for clean blends', 'Transitions masterclass: phrasing, EQ & filters', 'Beatmatching by ear: the two-minute version', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['DJs who can beatmatch and want to sound more polished']::text[], false, 'published', (select id from public.instructors where slug = 'amara-okafor'), 345,
  97, 4.7, 18, '2026-06-30T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('radio-mixshow-dj-song-structure', 'Song structure', 0),
  ('radio-mixshow-dj-eq-and-blending', 'EQ and blending', 1),
  ('radio-mixshow-dj-ear-training', 'Ear training', 2)
) as v(id, title, position)
where c.slug = 'radio-mixshow-dj'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('radio-mixshow-dj-phrase-mixing', 'radio-mixshow-dj-song-structure', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, true, 'Zeeshan Khamis', 0),
  ('radio-mixshow-dj-eq-essentials', 'radio-mixshow-dj-eq-and-blending', 'eq-essentials', 'EQ essentials for clean blends', 'How the low, mid and high EQs shape a blend, and how to use them to stop two tracks fighting in the middle of a mix.', 'https://www.youtube.com/watch?v=_zbtcdxKwsY', 449, true, 'Soundflow Music Academy', 0),
  ('radio-mixshow-dj-transitions-masterclass', 'radio-mixshow-dj-eq-and-blending', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, false, 'Club Ready DJ School', 1),
  ('radio-mixshow-dj-beatmatch-by-ear-quick', 'radio-mixshow-dj-ear-training', 'beatmatch-by-ear-quick', 'Beatmatching by ear: the two-minute version', 'The whole idea of beatmatching by ear in two minutes, so you know exactly what you''re listening for before you practice.', 'https://youtu.be/8LWLJF7i8ZI', 120, true, 'Club Ready DJ School', 0),
  ('radio-mixshow-dj-mix-without-the-screen', 'radio-mixshow-dj-ear-training', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, false, 'Club Ready DJ School', 1)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'radio-mixshow-dj'
on conflict (course_id, id) do nothing;

-- Your First Club Gig: Prep, Etiquette & Performance
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'first-club-gig', 'Your First Club Gig: Prep, Etiquette & Performance', 'Everything to know before your first club booking: preparing your music, booth etiquette, warm-up sets and getting booked again.', 'Everything to know before your first club booking: preparing your music, booth etiquette, warm-up sets and getting booked again.

Every lesson is taught by Leo Moreno, a working DJ, with drills you can practice on any setup. Work through each section at your own pace, record your progress and share your mixes for feedback from our instructors.', 'branding-gigs', '', 'Beginner', 'English', 'resident', '/images/courses/first-club-gig.jpg',
  'https://www.youtube.com/watch?v=ASUiL2pJp7w', array['Your first beatmatch in five steps', 'Phrasing: mix on the right bar', 'Transitions masterclass: phrasing, EQ & filters', 'Train your ears: mixing without the screen']::text[], array['A laptop and headphones', 'Any DJ controller or free DJ software to practice with']::text[], array['Complete beginners who want to learn to DJ properly from day one']::text[], false, 'published', (select id from public.instructors where slug = 'leo-moreno'), 230,
  276, 4.9, 54, '2026-06-16T09:00:00Z'
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('first-club-gig-be-gig-ready', 'Be gig-ready', 0),
  ('first-club-gig-sound-professional', 'Sound professional', 1),
  ('first-club-gig-play-anywhere', 'Play anywhere', 2)
) as v(id, title, position)
where c.slug = 'first-club-gig'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('first-club-gig-first-beatmatch', 'first-club-gig-be-gig-ready', 'first-beatmatch', 'Your first beatmatch in five steps', 'A practical walkthrough of getting two tracks playing in time: cueing the downbeat, starting the new track on the one, and matching tempo with the pitch fader.', 'https://www.youtube.com/watch?v=ASUiL2pJp7w', 456, true, 'DJ Phil Harris', 0),
  ('first-club-gig-phrase-mixing', 'first-club-gig-be-gig-ready', 'phrase-mixing', 'Phrasing: mix on the right bar', 'Why dance music is built in 8-, 16- and 32-bar phrases, and how starting your mixes on phrase boundaries makes every transition sound intentional.', 'https://www.youtube.com/watch?v=_O-yX9MnGMw', 455, false, 'Zeeshan Khamis', 1),
  ('first-club-gig-transitions-masterclass', 'first-club-gig-sound-professional', 'transitions-masterclass', 'Transitions masterclass: phrasing, EQ & filters', 'Bring phrasing, EQ and filters together into smooth, professional transitions you can use in any set.', 'https://www.youtube.com/watch?v=Fd9jEpFG6II', 1104, true, 'Club Ready DJ School', 0),
  ('first-club-gig-mix-without-the-screen', 'first-club-gig-play-anywhere', 'mix-without-the-screen', 'Train your ears: mixing without the screen', 'Put the waveforms away. Beatmatching, phrasing and blending purely by ear, the skill that makes you confident on any setup.', 'https://www.youtube.com/watch?v=8_erWzDmlj4', 2485, true, 'Club Ready DJ School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'first-club-gig'
on conflict (course_id, id) do nothing;

-- Advanced Scratch Combos: Transforms, Flares & Crabs
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'advanced-scratch-combos', 'Advanced Scratch Combos: Transforms, Flares & Crabs', 'Chain advanced crossfader techniques into combos that sound musical, clean and battle-ready.', '', 'scratch', '', 'Advanced', 'English', 'headliner', '/images/courses/scratch-school.jpg',
  '', array['Scratching in Serato: the basics', 'Record your scratches on a controller', 'Build a scratch tool in Ableton Live']::text[], array['Comfortable with the baby scratch and basic cuts', 'A turntable or controller with a responsive crossfader']::text[], array['Scratch DJs ready to build full routines']::text[], false, 'review', (select id from public.instructors where slug = 'marcus-reid'), 48,
  0, 0, 0, null
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('adv-scratch-school-scratch-basics', 'Scratch basics', 0),
  ('adv-scratch-school-practice-and-recording', 'Practice and recording', 1),
  ('adv-scratch-school-scratching-in-production', 'Scratching in production', 2)
) as v(id, title, position)
where c.slug = 'advanced-scratch-combos'
on conflict (course_id, id) do nothing;
insert into public.course_lessons (course_id, id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
select c.id, v.id, v.section_id, v.slug, v.title, v.summary, v.youtube, v.duration_seconds, v.preview, v.source, v.position from public.courses c, (values
  ('scratch-school-scratching-in-serato', 'adv-scratch-school-scratch-basics', 'scratching-in-serato', 'Scratching in Serato: the basics', 'Set up your controller for scratching in Serato and learn the first moves: hand position, the baby scratch and clean cuts.', 'https://www.youtube.com/watch?v=p-D38xJH9Ko', 421, true, 'DJ Blighty', 0),
  ('scratch-school-record-your-scratches', 'adv-scratch-school-practice-and-recording', 'record-your-scratches', 'Record your scratches on a controller', 'Creative ways to record your scratching on a controller with Serato, so you can review your technique and share your cuts.', 'https://www.youtube.com/watch?v=GEMlHyNFwao', 427, true, 'Kyle James Jezwinski', 0),
  ('scratch-school-ableton-scratch-tool', 'adv-scratch-school-scratching-in-production', 'ableton-scratch-tool', 'Build a scratch tool in Ableton Live', 'Bring DJ technique into production: build a scratch tool in Ableton Live and use it alongside Serato.', 'https://www.youtube.com/watch?v=cOtcWU6bL8g', 2029, true, 'Pointblank Music School', 0)
) as v(id, section_id, slug, title, summary, youtube, duration_seconds, preview, source, position)
where c.slug = 'advanced-scratch-combos'
on conflict (course_id, id) do nothing;

-- Beat Juggling 101
insert into public.courses (slug, title, subtitle, description, category, subcategory, level, language, access_plan, thumbnail,
  promo_video, outcomes, requirements, audience, drip, status, instructor_id, duration_minutes,
  sample_students, sample_rating, sample_reviews, published_at)
select 'beat-juggling-101', 'Beat Juggling 101', '', '', 'scratch', '', 'Intermediate', 'English', 'resident', '',
  '', '{}'::text[], '{}'::text[], '{}'::text[], false, 'draft', (select id from public.instructors where slug = 'marcus-reid'), 0,
  0, 0, 0, null
on conflict (slug) do nothing;
insert into public.course_sections (course_id, id, title, position)
select c.id, v.id, v.title, v.position from public.courses c, (values
  ('k8mxm758', 'Introduction', 0)
) as v(id, title, position)
where c.slug = 'beat-juggling-101'
on conflict (course_id, id) do nothing;

-- Blog posts ────────────────────────────────────────────────────────────────

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'gain-staging-for-djs', 'Gain Staging for DJs: Stop Hitting the Red', 'Why your mixes distort in the club even when the meters look fine, and a simple routine to set gain the same way every time.', '## Why gain matters

Most DJs set their channel levels by ear, then wonder why the club system sounds harsh.', 'mixing-techniques', array['gain staging', 'dj levels', 'mixer']::text[], '/images/blog/eq-mixing-101.jpg', 'draft', '2026-10-06T09:00:00Z', (select id from public.instructors where slug = 'leo-moreno')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'how-to-beatmatch-by-ear', 'How to Beatmatch by Ear: A Beginner''s Guide', 'Sync is handy, but beatmatching by ear is the skill that makes you trust your own set. Here''s the step-by-step method our students use to lock two tracks together without looking at the screen.', 'Sync buttons are brilliant, and plenty of great DJs use them. But learning to beatmatch by ear teaches you what''s actually happening between two tracks, and that''s exactly what saves you when a beat grid is wrong, a track drifts, or you''re playing on unfamiliar gear. The good news: it''s a skill, not a talent. With the right method and 15 focused minutes a day, most of our students can hold a clean blend within a few weeks.

## Set yourself up to succeed

- **Pick two tracks with steady, simple kick drums.** House or techno between 120 and 126 BPM is ideal. Avoid live drums, swing and tempo changes for now.
- **Hide the BPM display and waveforms** if your software allows it, or cover them with a sticky note. If your eyes can see the answer, your ears won''t do the work.
- **Turn Sync and Quantize off.**
- **Keep the volume sensible.** Beatmatching is about detail, not loudness. You''ll hear the kicks more clearly at a comfortable level.

## Step 1: Find the one

Let track A play through the speakers. In your headphones, find the first beat of a bar in track B, known as the **downbeat** or "the one". In most dance music it''s the first kick after a clear change: the start of a phrase, or the moment the bass or hi-hats come in. Set a cue point exactly on that kick.

> **Count out loud:** Count along with the music: "one, two, three, four." The one usually feels heavier. If you''re unsure, wait for a big change in the track. Those almost always land on a one.

## Step 2: Start the new track on the one

Count the bars of track A. On its next downbeat, release track B from your cue point. The kicks won''t line up perfectly yet, and that''s expected. What you''re listening for is which track is **faster**.

## Step 3: Match the tempo with the pitch fader

Listen to both kicks together in your headphones. If they drift apart, one track is faster. Here''s how to tell which:

- If the **incoming track''s kick lands first** (you''ll hear a galloping double kick), the incoming track is ahead. Slow it down slightly.
- If the **playing track''s kick lands first**, the incoming track is behind. Speed it up slightly.

Move the pitch fader in small steps, not big jumps, and give each change a few bars before you judge it. You''re done when the kicks stay locked together for 16 bars or more.

## Step 4: Nudge, don''t wrestle

Even with matched tempos, the beats can sit slightly out of phase. Use the outer edge of the jog wheel (or the platter edge on turntables) to nudge the incoming track forward or back with short, gentle touches. If you find yourself nudging constantly, the tempo still isn''t matched, so go back to the pitch fader.

## Step 5: Bring it into the mix

Once the kicks sit together in your headphones, start bringing track B in on the next phrase. Keep its bass cut at first (our [EQ Mixing 101 guide](/blog/eq-mixing-101) explains why), and keep listening. Tracks can drift over a long blend, so small pitch corrections mid-mix are completely normal.

## Common mistakes to avoid

- **Starting the new track at a random point.** Always release it on a one, or you''ll be fixing tempo and phrasing at the same time.
- **Making big pitch adjustments.** Large jumps overshoot. Think tiny moves and patience.
- **Wearing both sides of the headphones.** Try one ear on the headphones and one on the speakers, so you hear both tracks the way the crowd does.
- **Practicing with too many tracks.** Use the same two tracks for a week. Familiarity lets you focus on the skill.

## A simple practice routine

1. Mix the same two tracks back and forth for 10 minutes.
2. Swap one of them for a track at a slightly different tempo, for example 122 into 125 BPM.
3. Record a two-track blend and listen back the next day. Your ears catch more when your hands aren''t busy.

Stick with it. The first few days can feel impossible. Then one day you''ll hear the gallop before you''ve even thought about it, and that''s the moment beatmatching becomes yours.', 'mixing-techniques', array['mixing techniques', 'beatmatch', 'beginners']::text[], '/images/blog/how-to-beatmatch-by-ear.jpg', 'published', '2026-09-24T09:00:00Z', (select id from public.instructors where slug = 'marcus-reid')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'serato-vs-rekordbox', 'Serato vs rekordbox: Which Should You Learn First?', 'They''re two of the most popular DJ platforms in the world, and they suit different paths. Here''s how to choose the one that fits the gigs you actually want to play.', 'Choosing DJ software can feel like picking a side in an argument. Forums are full of people insisting their choice is the only serious option. The truth is calmer: Serato DJ Pro and rekordbox are both excellent, the core skills transfer completely, and the right choice mostly depends on **where you want to play**.

## The short answer

- **Choose rekordbox** if your goal is playing clubs on CDJs, where DJs typically arrive with a USB stick of prepared music.
- **Choose Serato** if you''re drawn to scratching, turntables, hip-hop and open-format sets, or mobile gigs with a controller.
- **Not sure yet?** Pick the one that works with the controller you own or can afford. You can learn the other one later in a weekend.

## rekordbox: built around the club workflow

rekordbox is developed by AlphaTheta, the company behind Pioneer DJ equipment. Its big strength is library preparation: you analyze tracks, set cue points and loops, organize playlists and export everything to a USB drive that plugs straight into club-standard players.

It also has a full performance mode for playing from a laptop with a controller. Some features sit behind subscription plans while others are unlocked by compatible hardware, so check exactly what your controller includes before you buy.

> **Good to know:** Plenty of DJs who perform with Serato at home still use rekordbox to prepare USBs for club gigs. Learning its library tools is useful whatever you practice on.

## Serato DJ Pro: a performance favorite

Serato has deep roots in turntablism and open-format DJing. Its interface is famously clean and stable, and its DVS (digital vinyl system) support lets you control digital files with real turntables and timecode vinyl, the setup behind countless battle DJs and hip-hop sets.

Serato DJ Lite, the free entry version, works with many beginner controllers, and upgrading to Pro unlocks the full feature set. As with rekordbox, some controllers include a Pro license, so it''s worth checking.

## What''s the same (and matters more)

Both platforms cover the essentials: waveforms, beat grids, hot cues, loops, key detection, effects and recording. And the skills that make you a good DJ, like beatmatching, phrasing, EQ, track selection and reading a room, are identical on both. A great set on Serato would be a great set on rekordbox.

## Questions to help you decide

1. **Where do you want to play in the next year?** Clubs with CDJs point toward rekordbox. For bars, weddings and events where you bring your own controller, either works.
2. **Do you want to scratch on turntables?** Serato''s DVS workflow is hard to beat.
3. **What hardware do you own or plan to buy?** Many controllers are designed around one platform, and matching them avoids headaches.
4. **How do you like to organize music?** Try the free versions of both with 50 tracks. You''ll quickly feel which library workflow suits you.

## Our recommendation

Learn one platform properly before touching the other: your library, cue points and recording workflow. Once your mixing feels solid, spend an afternoon learning the other platform''s export or performance mode. Versatility is a real advantage when you start getting booked, and our guide to [choosing your first DJ controller](/blog/choosing-your-first-dj-controller) covers the hardware side of the decision.', 'gear-software', array['gear & software', 'serato', 'rekordbox', 'should']::text[], '/images/blog/serato-vs-rekordbox.jpg', 'published', '2026-09-19T09:00:00Z', (select id from public.instructors where slug = 'mei-tanaka')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'amapiano-transitions', '10 Amapiano Transitions That Always Pack the Dance Floor', 'Amapiano rewards patience, groove and taste. These ten transitions, from the classic log drum swap to the vocal hand-off, will make your sets feel smooth, deliberate and impossible to leave.', 'Amapiano isn''t a genre you rush. Its slow-burning grooves, jazzy piano chords and rubbery log drum basslines are built for long, hypnotic blends. Most tracks sit around 110–115 BPM and many have generous intros and outros, which gives you plenty of room to be creative. These are ten transitions our instructors reach for in almost every set.

## The golden rule: never let two log drums fight

The log drum carries the bassline, and two of them playing at once turns the low end into mud. Almost every transition below is really about managing the low end, so get comfortable with your EQs first.

## 1. The log drum swap

Blend the incoming track with its low EQ fully cut. On a phrase change, usually after 16 or 32 bars, swap the bass: cut the outgoing low as you bring the incoming low up, in one smooth motion. This is the backbone of amapiano mixing.

## 2. The long piano blend

When two tracks sit in compatible keys, let their chords overlap for 32 bars or more with the lows swapped. The layered pianos create a lush third track that only exists in your mix. Check the keys first. Our [Camelot wheel guide](/blog/harmonic-mixing-camelot-wheel) makes it quick.

## 3. The shaker bridge

Loop a four- or eight-bar section of shakers and percussion from the outgoing track, bring the new track in underneath, then release the loop. The steady shaker pattern disguises the join.

## 4. The filter fade

Slowly sweep a low-pass filter on the outgoing track while the incoming track rises, so the old track seems to melt away. Keep the sweep long. A fast filter move sounds like a mistake.

## 5. The vocal hand-off

Let the outgoing vocal finish its line, then bring the incoming vocal in on the next phrase. Avoid overlapping two vocals: the crowd should always know who''s singing.

## 6. The echo out

At the end of a phrase, add an echo (delay) effect to the outgoing track as you pull its volume down, then drop the incoming track on the one. It''s great for switching energy or moving between subgenres.

## 7. The breakdown drop

Many amapiano tracks have a breakdown where the drums fall away. Mix the incoming track''s beat in during that breakdown, so the "drop" arrives on your new track.

## 8. The acapella tease

Play a few lines of a well-known vocal over the instrumental section of your current track before the full song arrives. Crowds love hearing a favorite coming before it lands.

## 9. The tempo walk

Moving from Afrobeats, which often sits around 100–110 BPM, into amapiano? Raise the tempo gradually across two or three transitions instead of one big jump, so nobody on the floor notices the shift.

## 10. The clean cut

Sometimes the best transition is no transition. On a strong downbeat after a build, cut straight into the new track. Use it sparingly. It''s powerful precisely because the rest of your set is so smooth.

> **Practice drill:** Pick three tracks and try every transition between them, recording each attempt. Listen back and note which ones suit your style. The best amapiano DJs have a signature move, so find yours.

Want the backstory behind the sound you''re mixing? Read [how amapiano went from South Africa to the world](/blog/how-amapiano-went-global).', 'mixing-techniques', array['mixing techniques', 'amapiano', 'transitions', 'always']::text[], '/images/blog/amapiano-transitions.jpg', 'published', '2026-09-15T09:00:00Z', (select id from public.instructors where slug = 'daniel-mensah')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'land-your-first-club-booking', 'Land Your First Club Booking Without a Big Following', 'Promoters book DJs who make their night better, not just DJs with big follower counts. Here''s how to get on their radar, earn the warm-up slot and turn it into a regular gig.', 'Every working DJ remembers their first club booking, and very few got it because of their follower count. Promoters and venue managers need reliable people who understand the room and make the night better. That''s something you can prove long before you''re well known.

## 1. Know the room before you ask

Go to the nights you want to play. Arrive early and watch the warm-up DJ. Notice the sound, the energy curve and what the crowd responds to. When you eventually reach out, you''ll be able to explain exactly why you fit, and promoters can tell the difference between a DJ who''s been there and one who''s sending the same message to twenty venues.

## 2. Record a mix for the slot you want

Your mix is your audition. Record a 45 to 60 minute set that sounds like the slot you''re asking for, not your personal peak-time dream. For most first bookings that means an opening set: groovy, patient and building slowly. Keep it technically clean, and start strong, because busy promoters often only hear the first few minutes.

> **Stand out:** A great warm-up mix is rarer than a great peak-time mix. Showing you understand how to open a night instantly sets you apart.

## 3. Build real relationships

Talk to the resident DJs, the bar staff and the promoter, not with a pitch but as someone who genuinely loves the night. Support other DJs'' gigs. Scenes are small, and the person who recommends you is often a resident who''s heard you''re reliable and easy to work with.

## 4. Send a short, professional pitch

When the time is right, keep your message brief:

- Who you are and where you''ve played. Small gigs count.
- Why you fit their night specifically.
- A link to one mix that matches the slot, plus your [press kit](/blog/dj-press-kit).
- Your availability, and that you''re happy to open.

Follow up once, politely, after a week or two. Silence usually means "busy", not "no".

## 5. Say yes to the small stuff

Bar sets, community events, online radio shows and friends'' parties all build the thing promoters look for most: proof that you can hold a room. Treat every small gig like a headline show.

## 6. Be the DJ they want to rebook

Landing the slot isn''t the finish line. The rebooking is. Arrive early. Bring backups: two USB drives, your own headphones and the right adapters. Stick to your set time, respect the energy of the DJ who follows you, and thank the staff on the way out. Reliability is the most underrated skill in DJing.

## What about promoting the night?

Share the event and bring friends if you can. It helps. But never promise numbers you can''t deliver. Being honest about your draw and brilliant in the booth will take you much further than inflated promises.', 'gigs-career', array['gigs & career', 'booking', 'without', 'following']::text[], '/images/blog/land-your-first-club-booking.jpg', 'published', '2026-09-11T09:00:00Z', (select id from public.instructors where slug = 'amara-okafor')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'eq-mixing-101', 'EQ Mixing 101: Stop Your Transitions Sounding Muddy', 'Muddy, messy transitions are almost always an EQ problem. Learn how to set your levels, swap basslines cleanly and use the mids and highs to make two tracks sound like one.', 'If your transitions sound busy or muddy even when the beats are perfectly matched, the problem usually isn''t your beatmatching. It''s your EQ. Two full tracks playing at once contain twice the bass, twice the vocals and twice the hi-hats. Your job is to make space so they sound like one piece of music.

## First, get your levels right

Before touching the EQ, set each channel''s **gain** (sometimes called trim). Tracks are mastered at different loudness, so match them using the channel meters: aim for both channels peaking at a similar level, in the upper green or amber, never sitting in the red. Then keep both channel faders at the same position. Good gain staging makes every other EQ move predictable.

## How a three-band EQ works

- **Low:** kick drums and basslines, the weight of the track.
- **Mid:** vocals, synths, chords and snares, the character of the track.
- **High:** hi-hats, cymbals and air, the energy and sparkle.

Most DJ mixers let you cut each band much further than you can boost it. That''s a hint: **mixing is mostly about cutting, not boosting.**

## The bass swap: your most important move

Two basslines playing together are the number one cause of muddy mixes. Here''s the classic technique:

1. Bring the incoming track in with its **low EQ fully cut**.
2. Blend in its mids and highs as the mix builds.
3. On a phrase change, **swap the lows**: cut the outgoing bass as you bring the incoming bass up, ideally in one motion that lands on the downbeat.

Timing matters more than speed. A swap on the first beat of a new phrase sounds intentional. A swap in the middle of a bar sounds like a mistake.

> **Practice drill:** Blend two tracks and do nothing but bass swaps for ten minutes, swapping back and forth every 16 bars. Once it''s automatic, your mixes will instantly sound cleaner.

## Taming the mids

When both tracks have vocals or busy synths, turn down the mids on the track that should sit in the background. It''s also a smart way to hide a key clash for a few bars while you move to the next track.

## Using the highs for energy

Bringing in the incoming track''s hi-hats slowly creates anticipation: the crowd feels something building before they can hear what it is. Cutting the highs on the outgoing track as you finish the blend lets it fade gently into the background.

## EQ versus filter

A filter sweeps away everything above or below a moving point, which is great for dramatic builds and exits. EQ is subtler and more precise. Use EQ for everyday blending, and save filters for moments you want the crowd to notice.

## Common EQ mistakes

- **Boosting to make a track louder.** Use the gain or fader instead. Boosting pushes you into distortion.
- **Leaving the EQs wherever the last blend left them.** Return to neutral once each transition is finished.
- **Mixing only with the channel faders.** Volume fades alone leave basslines and vocals fighting in the middle of the blend.
- **Judging your EQ in headphones only.** Check on speakers, ideally at the volume a crowd would hear.

Get these basics right and your transitions will start to sound like one long, continuous piece of music, which is exactly the point. If you''re still working on locking the beats together, start with our guide to [beatmatching by ear](/blog/how-to-beatmatch-by-ear).', 'mixing-techniques', array['mixing techniques', 'mixing', 'transitions', 'sounding']::text[], '/images/blog/eq-mixing-101.jpg', 'published', '2026-09-08T09:00:00Z', (select id from public.instructors where slug = 'leo-moreno')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'home-dj-studio-on-a-budget', 'How to Build a Home DJ Studio on a Budget', 'You don''t need a club booth in your bedroom. Here''s where to spend, where to save, and how to set up a home DJ space that helps you practice, record and improve.', 'A good home setup doesn''t need to be expensive. It needs to be comfortable enough that you practice every day, accurate enough that you hear what you''re doing, and simple enough to record your mixes. Here''s how to build it without wasting money.

## 1. The controller or decks

This is where most of your budget should go. A solid two-channel controller with full-size jog wheels and a proper mixer section will teach you everything you need. Our guide to [choosing your first DJ controller](/blog/choosing-your-first-dj-controller) covers what to look for.

## 2. Headphones

Closed-back DJ headphones block outside noise so you can cue clearly. Look for comfort, ear cups that swivel for one-ear monitoring, a detachable cable (the part that breaks most often) and a sturdy headband. A mid-range pair from a reputable brand will outlast several cheap ones.

## 3. Speakers

Practicing only on headphones is tiring and gives you a false picture of your mix. A pair of powered monitor speakers makes a big difference. Set them up so they form an equal-sided triangle with your head, tweeters roughly at ear height, and keep them away from walls where you can to avoid boomy bass.

> **Budget tip:** Small powered monitors with good placement beat big speakers crammed into a corner. Placement is free, so use it.

## 4. Your desk and posture

DJs stand, so your controller should sit at a height where your forearms rest comfortably with your elbows slightly bent. That''s usually higher than a normal desk. A sturdy table riser, a standing desk or a solid shelf can all work, and your back will thank you after a two-hour session.

## 5. The room

You don''t need acoustic foam on every wall. A rug, curtains, a sofa and a bookshelf all soften reflections in a small room. If you can, avoid setting up in an empty, echoey space.

## 6. Recording

Recording every practice session is the fastest way to improve. Most DJ software can record internally, so set it up from day one and save your recordings in dated folders to track your progress.

## Where to save money

- **Buy used** from reputable sellers. Controllers and speakers often come up for sale in great condition.
- **Skip the lights and gadgets** until your mixing is solid.
- **Don''t buy a huge music library all at once.** Fifty tracks you know inside out are worth more than five thousand you''ve barely heard.

## Where not to cut corners

- **Cables and power.** Cheap cables cause crackles and dropouts that will drive you mad.
- **Your hearing.** Keep the volume sensible, and read our guide to [protecting your ears](/blog/protect-your-hearing).

Start simple, practice often, and upgrade when a specific limitation is holding you back, not because of a shiny advert.', 'gear-software', array['gear & software', 'studio', 'budget']::text[], '/images/blog/home-dj-studio-on-a-budget.jpg', 'published', '2026-09-04T09:00:00Z', (select id from public.instructors where slug = 'sofia-martins')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'practice-in-20-minutes-a-day', 'How to Practice DJing in Just 20 Minutes a Day', 'Short on time? Twenty minutes of focused practice beats a two-hour jam with no plan. Here''s the routine our instructors give students with busy lives.', 'Most people think they need hours to get better at DJing. In reality, the students who improve fastest aren''t the ones with the most free time. They''re the ones who practice with a plan. Twenty focused minutes, five days a week, adds up to more than seven hours of deliberate practice a month.

## The 20-minute session

1. **Warm up (2 minutes).** Play one track, check your headphone and speaker levels, and start your recording.
2. **Focused drill (10 minutes).** Work on one skill only: bass swaps, beatmatching by ear, a scratch pattern or a specific transition.
3. **Record a blend (5 minutes).** Mix two tracks from start to finish as if a crowd were listening.
4. **Review (3 minutes).** Listen back and write one sentence about what to fix tomorrow.

## Rotate a weekly theme

Give each week a focus so your skills build in layers:

- **Week 1:** beatmatching and phrasing. Our guide to [beatmatching by ear](/blog/how-to-beatmatch-by-ear) is a good place to start.
- **Week 2:** EQ and the bass swap, covered in [EQ Mixing 101](/blog/eq-mixing-101).
- **Week 3:** track selection and energy, building a mini set of five tracks.
- **Week 4:** creative transitions with loops, echo outs and filters.

> **Keep a practice log:** A notes app is enough: the date, the drill and one sentence of feedback. After a month you''ll spot patterns in your mistakes, and have proof of how far you''ve come.

## Why short sessions work

Motor skills settle in between sessions, especially after a night''s sleep, which is why a little practice every day beats one marathon weekend. Short sessions also keep your focus sharp: after 20 minutes of concentrated listening, most people start coasting anyway.

## Make it easy to start

- **Leave your setup ready to go.** If you have to plug in cables first, you''ll skip days.
- **Prepare a practice playlist** of 20 to 30 tracks you know well, so you''re not wasting time digging.
- **Practice at the same time each day.** Habit beats motivation.

## When you have more time

On days with an extra hour, record a full 30 to 45 minute set and treat it like a real gig, with a planned opening, build and ending. Then go back to your 20-minute routine to fix the weak spots you hear.

Consistency is the secret. Twenty minutes today is worth more than two hours someday.', 'practice-wellbeing', array['practice & wellbeing', 'practice', 'minutes']::text[], '/images/blog/practice-in-20-minutes-a-day.jpg', 'published', '2026-08-31T09:00:00Z', (select id from public.instructors where slug = 'marcus-reid')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'make-your-first-edit-in-ableton', 'Make Your First DJ Edit in Ableton Live', 'A DJ edit turns a radio-length song into something you can actually mix. Learn how to warp a track, build a clean intro and export a club-ready edit in Ableton Live.', 'Some songs are perfect for your set but almost impossible to mix: they open with a vocal on the first beat, end abruptly, or have a long breakdown that empties the floor. A DJ edit fixes that. You''re not remixing the song. You''re rearranging what''s already there so it fits the way you play.

## What you''ll need

- Ableton Live. Any edition handles simple edits.
- A high-quality file of the track: WAV, AIFF or a 320 kbps MP3.
- Headphones or monitors, and about an hour.

## Step 1: Import and warp the track

Drag the song into Arrangement View. Live will analyze it and estimate the tempo. Zoom in on the waveform and check that the **warp markers** line up with the kick drums across the track. For most electronic and pop music with a steady tempo, you only need to confirm the tempo and place the first downbeat correctly.

Right-click the warp marker on the first kick and choose **Set 1.1.1 Here** so the grid starts exactly on the downbeat. Now every bar line in Live matches the music.

## Step 2: Map the structure

Play through the song and add locators at each section: intro, verse, chorus, breakdown and outro. You''ll start seeing the song as blocks of 8 and 16 bars, which are the building blocks of your edit.

## Step 3: Build a DJ-friendly intro

Find a section with just drums, or drums and bass, and no vocals. Copy 16 or 32 bars of it to the very start of the arrangement. Now the song opens with a clean, beat-driven section that''s easy to mix into.

> **No drums-only section?:** Loop a short percussion part, or program a simple kick and hi-hat pattern in a Drum Rack at the song''s tempo. Keep it minimal so it doesn''t clash with the original.

## Step 4: Tidy the middle and the ending

- **Shorten long breakdowns** by removing 8 or 16 bars, always cutting on bar lines.
- **Extend the outro** by repeating the final instrumental section, so you (or the next DJ) have room to mix out.
- **Add short fades** at the start and end of each clip to prevent clicks at your edit points.

## Step 5: Consolidate and check

Select the whole arrangement and consolidate it into one clip with **Ctrl+J** (Windows) or **Cmd+J** (Mac). Then listen from start to finish, paying close attention to every edit point. If a cut feels sudden, try moving it to the start of a phrase.

## Step 6: Export

Choose **File > Export Audio/Video** and export a WAV or AIFF at 24-bit, keeping the sample rate of your original file. Name it clearly, for example "Artist – Title (Your Name Edit)", then import it into your DJ software and check the beat grid.

## A note on copyright

Making edits for your own sets is common practice, but releasing, selling or distributing an edit of someone else''s music requires permission from the rights holders. Keep your edits in your own crate unless you have clearance.

Your first edit might take an hour. Your tenth will take fifteen minutes, and your sets will be full of versions nobody else can play. When you start producing your own tracks, our guide to [DJ-friendly intros and outros](/blog/dj-friendly-intros-and-outros) is the natural next step.', 'music-production', array['music production', 'ableton']::text[], '/images/blog/make-your-first-edit-in-ableton.jpg', 'published', '2026-08-27T09:00:00Z', (select id from public.instructors where slug = 'sofia-martins')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'how-amapiano-went-global', 'How Amapiano Went From South Africa to the World', 'From township parties in Gauteng to dance floors worldwide, amapiano has become one of the most influential dance sounds of the decade. Here''s how it happened, and what it means for DJs.', 'In just a few years, amapiano grew from a local South African sound into one of the most exciting movements in global dance music. Its unmistakable log drum basslines now echo through clubs from Lagos to London. Here''s a short guide to where it came from, how it spread, and why DJs everywhere are learning to play it.

## Where it started

Amapiano took shape in the early-to-mid 2010s in the townships of South Africa''s Gauteng province, around Johannesburg and Pretoria. The name comes from isiZulu and roughly means "the pianos", a nod to the jazzy, soulful keys at the heart of the sound.

It grew out of South Africa''s deep house music culture, drawing on kwaito, jazz and lounge. Producers settled on slower tempos, typically around 110–115 BPM, and built tracks from warm chords, crisp percussion and a bouncing, percussive bass sound that became known as the **log drum**.

## How it spread

Amapiano didn''t wait for radio or major labels. It spread the way many modern movements do:

- **Street parties and local clubs,** where DJs tested new tracks on live crowds every weekend.
- **Messaging apps and social media,** as tracks and mixes were passed from phone to phone.
- **Dance challenges,** which turned songs into viral moments and pulled in audiences who''d never heard the genre.
- **Streaming and livestreamed DJ sets,** which let fans anywhere tune in to South Africa''s scene.

## The artists who carried it

Kabza De Small and DJ Maphorisa, who also work together as Scorpion Kings, became central figures, while acts like Major League DJz took the sound to international audiences through their livestreamed sets. A new generation of DJs, including Uncle Waffles, broke through on social media, and crossover hits carried amapiano''s influence into pop.

When South African singer Tyla won the first Grammy for Best African Music Performance in 2024 with "Water", a song steeped in amapiano, it showed how far the sound had traveled.

## Why it works on the dance floor

Amapiano is patient. Tracks often run long, with slow builds and extended intros. Crowds don''t just dance to the drops: they wait for the log drum to return, sing the piano lines and move with the groove. For DJs, that means **long blends, careful control of the low end and respect for the vibe** matter more than flashy tricks.

## How to play it respectfully

- **Learn the culture, not just the tracks.** Listen to South African DJs'' sets and notice how they pace a night.
- **Credit and support the artists.** Buy music on legitimate platforms and share the producers'' names.
- **Master the fundamentals.** Our guide to [10 amapiano transitions](/blog/amapiano-transitions) is a great place to start.

Amapiano''s rise is a reminder that the most exciting music often comes from local scenes with something to say. The rest of the world is still catching up, and there''s never been a better time to learn it.', 'genres-culture', array['genres & culture', 'amapiano', 'africa']::text[], '/images/blog/how-amapiano-went-global.jpg', 'published', '2026-08-22T09:00:00Z', (select id from public.instructors where slug = 'daniel-mensah')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'dj-press-kit', 'Build a DJ Press Kit Promoters Actually Read', 'Promoters spend seconds deciding whether to listen to you. A clear, honest press kit makes those seconds count. Here''s exactly what to include, and what to leave out.', 'A press kit, often called an EPK (electronic press kit), is your professional introduction. It tells promoters, venues and clients who you are, what you sound like and how to book you, all in under a minute. It doesn''t need to be fancy. It needs to be clear, current and easy to find.

## What to include

### 1. A short bio

Write two versions in the third person: a **short bio** of about 50 words for event listings, and a **longer bio** of about 150 words for your website. Focus on your sound, your story and a few real highlights. Skip clichés like "music has always been my passion" and show it instead.

### 2. Your best mixes

Include two or three recent mixes that represent the gigs you want, labeled clearly: "Warm-up set", "Peak time", "Open format". The first few minutes matter most, so make sure every mix starts strong.

### 3. Photos

Include a few high-resolution photos in both landscape and portrait, ideally one of you performing and one clean portrait. Promoters use them for posters and social posts, so they should be sharp, well lit and recent.

### 4. Highlights and residencies

List notable gigs, residencies, radio shows and support slots. Be honest: inflated claims are easy to check and damage trust quickly.

### 5. A technical rider

Tell venues what you need to perform: the number of players or turntables, your preferred mixer, booth monitors, and whether you''ll bring a laptop. Keep it realistic for the size of venue you''re approaching.

### 6. Contact details and links

A professional email address, your booking contact if you have one, and links to your main music and social profiles.

> **Format tip:** A simple one-page website or a PDF under 5 MB works best. Share a link rather than a big attachment that clogs someone''s inbox.

## What to leave out

- **Follower counts** that don''t reflect real local demand.
- **Every mix you''ve ever recorded.** Curate ruthlessly.
- **Out-of-date information.** A press kit that lists last year''s residency makes you look inactive.

## Keep it alive

Update your press kit every few months with fresh photos, your newest mix and recent gigs. When you pitch a venue, tailor the message and link to the most relevant mix. Our guide to [landing your first club booking](/blog/land-your-first-club-booking) walks through the whole process.

A great press kit won''t get you booked on its own, but it removes every excuse not to listen, and that''s exactly what you want.', 'gigs-career', array['gigs & career', 'promoters', 'actually']::text[], '/images/blog/dj-press-kit.jpg', 'published', '2026-08-18T09:00:00Z', (select id from public.instructors where slug = 'amara-okafor')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'harmonic-mixing-camelot-wheel', 'The Camelot Wheel: Harmonic Mixing in 5 Minutes', 'Some blends sound magical, others clash no matter how perfect the beatmatch. The difference is often musical key, and the Camelot wheel makes harmonic mixing simple.', 'You''ve matched the beats perfectly, the EQ is clean, and yet the blend sounds off. Sour, even. The likely culprit is **key**. Every track is written in a musical key, and some keys sound great together while others clash. Harmonic mixing means choosing combinations that work, and the Camelot wheel makes it easy even if you''ve never studied music theory.

## What is the Camelot wheel?

The Camelot wheel maps all 24 musical keys to simple codes: a number from 1 to 12 and a letter. **A** means a minor key and **B** means a major key. For example, A minor is 8A and C major is 8B. Popularized by the harmonic mixing tool Mixed In Key, this notation is now supported by most DJ software, which can analyze your tracks and display their keys this way.

## The three safe moves

From any track, these moves almost always sound good:

- **Same code:** 8A to 8A. Both tracks share a key, so this is the smoothest possible blend.
- **One step around the wheel:** 8A to 7A or 9A. These are closely related keys that share most of their notes.
- **Switch the letter:** 8A to 8B. This is the relative major or minor: the same notes with a different mood, perfect for lifting or darkening the feel of your set.

> **The quick rule:** Stay on the same number, move one step up or down, or swap A and B. Master those three moves and you''ll avoid most key clashes.

## Adding energy

Moving **one step clockwise**, for example 8A to 9A, tends to feel like a gentle lift. Some DJs also jump **two steps clockwise** for a deliberate energy boost, but it''s riskier. Keep those blends short, and cut rather than overlap for long.

## Watch out for tempo changes

When you speed up or slow down a track without key lock (sometimes called master tempo), its pitch changes too. A tempo change of around 6% moves a track by roughly one semitone, which is enough to change its key completely. Turn key lock on for bigger tempo changes, though very large changes can add audible artifacts.

## Key isn''t everything

Harmonic mixing is a tool, not a rule. Drum-led tracks with little melody often mix fine regardless of key, and a clash can be hidden for a few bars by cutting the mids (see [EQ Mixing 101](/blog/eq-mixing-101)). Energy, groove and track selection always come first. Key simply helps the magic moments happen more often.

## Try this today

1. Analyze your practice playlist and set your software to display keys.
2. Pick one track and find two others that are a safe move away.
3. Blend each pair for 32 bars and listen to how the melodies sit together.

Once you hear the difference, you won''t stop hearing it.', 'mixing-techniques', array['mixing techniques', 'camelot', 'harmonic', 'mixing', 'minutes']::text[], '/images/blog/harmonic-mixing-camelot-wheel.jpg', 'published', '2026-08-14T09:00:00Z', (select id from public.instructors where slug = 'leo-moreno')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'choosing-your-first-dj-controller', 'What to Look for in Your First DJ Controller', 'The right first controller makes learning fun and prepares you for club gear. The wrong one holds you back. Here''s what actually matters when you''re buying, without the brand hype.', 'Browse any music store and you''ll find dozens of DJ controllers, from toy-like gadgets to professional all-in-one systems. The good news: you don''t need the most expensive one. You need one that teaches you the right habits. Here''s what to look for.

## 1. A club-style layout

Choose a controller laid out like a club setup: two decks with jog wheels on the sides and a mixer in the middle, with proper channel faders, a crossfader, gain knobs and a three-band EQ on each channel. Everything you learn on this layout transfers directly to club players and mixers.

## 2. Two channels is plenty

Four-channel controllers look impressive, but beginners rarely need them. Two channels let you learn everything (beatmatching, EQ, phrasing and transitions) without distraction. Spend the difference on good headphones instead.

## 3. Jog wheels you can trust

Jog wheels are how you nudge, cue and scratch. Larger, solid-feeling wheels with a touch-sensitive top are easier to control. If you can, try a few in a store: the feel matters more than the spec sheet.

## 4. Software compatibility

Check which DJ software the controller works with and whether it includes a full license or only a lite version. If you already know whether you want [Serato or rekordbox](/blog/serato-vs-rekordbox), let that guide your choice.

## 5. The right inputs and outputs

- **A headphone output** on the front, with its own cue volume.
- **A master output** that suits your speakers: RCA is fine at home, while balanced XLR or TRS outputs are better for bigger systems.
- **A booth output** if you plan to play small gigs.
- **A microphone input** if you''ll host events or weddings.

## 6. Standalone or laptop?

Standalone units run without a computer, which is great for reliability and feels closer to club gear, but they cost more. Laptop-based controllers are the most affordable way to start. Either is a good choice; just make sure your laptop meets the software''s requirements.

## 7. Build quality and resale value

A sturdy controller from an established brand will survive years of practice and hold its resale value when you upgrade. Buying used from a reputable seller can get you a better model for the same money.

> **Avoid these:** Controllers with no channel EQs, tiny plastic jog wheels or no real mixer section. They''re cheaper for a reason, and they can build habits you''ll need to unlearn later.

## The bottom line

The best first controller is one you''ll practice on every day. Choose a club-style layout, two good channels, reliable jog wheels and the software you want to learn, then put your energy into practicing. Our guide to building a [home DJ studio on a budget](/blog/home-dj-studio-on-a-budget) covers the rest of your setup.', 'gear-software', array['gear & software', 'controller']::text[], '/images/blog/choosing-your-first-dj-controller.jpg', 'published', '2026-08-10T09:00:00Z', (select id from public.instructors where slug = 'mei-tanaka')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'wedding-dj-checklist', 'Wedding DJ Checklist: 12 Things to Confirm First', 'A wedding is one night that has to go right. Confirm these twelve things before the big day and you''ll walk in calm, prepared and ready to fill the dance floor.', 'Wedding DJing is a different craft from club DJing. You''re the soundtrack, the timekeeper and often the MC for one of the most important days of someone''s life. Most wedding problems come from details nobody confirmed, so use this checklist in your planning meeting and again the week before the event.

## The checklist

1. **The full timeline.** Guest arrival, ceremony, drinks, entrances, dinner, speeches, first dance, cake cutting and the last song, all with times.
2. **Ceremony music cues.** Exactly which songs play for the processional, the signing and the recessional, and who gives you the signal.
3. **The grand entrance.** The order of the wedding party, the song, and how each name should be announced.
4. **Name pronunciations.** Write them phonetically and practice them out loud. A mispronounced name is the mistake everyone remembers.
5. **The first dance.** The exact version of the song, whether it should be shortened, and how it should end.
6. **Must-play and do-not-play lists.** Respect both. The do-not-play list matters more than people think.
7. **The crowd.** The ages, cultures and music tastes of the guests, so you can plan for the whole room, from grandparents to college friends.
8. **Speeches and microphones.** Who''s speaking, in what order, and whether you''re providing wireless mics. Pack spare batteries.
9. **Venue rules.** Sound limits, curfew, load-in times, parking, and any restrictions on lighting or haze.
10. **Power and setup position.** Where you''ll set up, how far away the nearest outlet is, and whether you''re under cover if the event is outdoors.
11. **Key contacts.** The planner or venue coordinator''s number, and who makes the call if the timeline changes on the day.
12. **The contract.** Start and finish times, overtime rates, meals and breaks, and payment terms, all in writing.

> **Backup plan:** Bring a backup for anything that can stop the music: a second playback source, spare cables, and a phone or tablet loaded with the ceremony songs and the first dance.

## On the day

Arrive early enough to set up, soundcheck and change before guests arrive. Keep dinner music at a level where people can talk. Watch the couple and the coordinator, not just your screen: timelines always shift, and your calm flexibility is part of the service.

## Reading a wedding crowd

Weddings reward variety. Open the dancing with songs that bring several generations to the floor, then gradually lean into what the core crowd responds to. Take requests graciously, but play them when they fit the energy, not the second they''re asked.

Get the details right and the couple will barely notice everything you did. That''s the highest compliment a wedding DJ can get.', 'gigs-career', array['gigs & career', 'wedding', 'checklist', 'things', 'confirm']::text[], '/images/blog/wedding-dj-checklist.jpg', 'published', '2026-08-05T09:00:00Z', (select id from public.instructors where slug = 'amara-okafor')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'crate-digging', 'Crate Digging: Where Working DJs Find Fresh Music', 'Your music selection is your signature. Here''s where working DJs find tracks nobody else is playing, and how they organize them so the right song is always ready.', 'Two DJs with identical technical skills can sound completely different because of what they play. Great selection is what turns a technically good set into a memorable one, and it comes from one habit: digging for music regularly.

## Where to dig

### Record stores

Independent record stores are still one of the best places to discover music. Tell the staff what you play and what you love. Their recommendations can open up entire genres.

### Online stores and Bandcamp

Digital stores built for DJs let you browse by genre, label and chart. Bandcamp is fantastic for independent artists and labels, and buying there often puts more money directly into the creators'' pockets.

### Labels and artists

When you find a track you love, look up the label and the producer. Explore their back catalogs and the artists they support. One great release usually leads to ten more.

### DJ mixes and radio

Listen to mixes and radio shows from DJs you respect. Tracklist sites and a music recognition app will help you identify the gems. Notice not just the tracks, but how they''re sequenced.

### Record pools

For open-format, mobile and wedding DJs, record pools provide licensed clean versions, intros and edits of popular songs. They''re a huge time-saver.

> **Dig with intention:** Set aside a regular slot each week with a clear goal, like "three new warm-up tracks" or "two vocal house records for Saturday". Aimless scrolling can eat hours.

## Buy quality files

Use lossless files (WAV or AIFF) or high-quality 320 kbps MP3s. Low-quality rips sound noticeably worse on big sound systems, and buying your music supports the artists who make your sets possible.

## Organize as you go

- **Listen to every track in full** before it goes into a gig playlist.
- **Sort by role, not just genre:** warm-up, build, peak time, closing and secret weapons.
- **Tag energy and key** so you can find compatible tracks fast. Our [Camelot wheel guide](/blog/harmonic-mixing-camelot-wheel) explains key notation.
- **Set cue points** on the first downbeat, the drop and the outro while the track is fresh in your mind.

## Keep your crate alive

Revisit older music too. A track from ten years ago that nobody has heard in a while can be the biggest moment of your night. Digging isn''t just about finding what''s new. It''s about finding what''s right.', 'genres-culture', array['genres & culture', 'digging', 'working']::text[], '/images/blog/crate-digging.jpg', 'published', '2026-07-31T09:00:00Z', (select id from public.instructors where slug = 'marcus-reid')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'dj-friendly-intros-and-outros', 'Make DJ-Friendly Intros and Outros for Your Tracks', 'If you produce your own music, make it easy for DJs (including you) to play it. Here''s how to structure intros and outros that mix smoothly on any setup.', 'A great track that''s hard to mix often gets skipped. Whether you''re making originals, remixes or edits, building DJ-friendly intros and outros is one of the simplest ways to get your music played, both by other DJs and in your own sets.

## Why DJs need space

When a DJ brings your track in, they need a section to beatmatch and blend while the previous track is still playing. If your song opens with a full bassline, chords and vocals on the first beat, there''s nothing to blend, just a clash. The same goes for the ending: an abrupt stop leaves no room to mix out.

## Building the intro

- **Start on the downbeat.** Put the first kick right at the start of the file with no silence before it, so DJ software sets the beat grid correctly and cue points are instant.
- **Keep it rhythmic.** 16 or 32 bars of drums and percussion is standard, and enough for a comfortable blend.
- **Add elements gradually.** Introduce hi-hats, percussion and subtle textures every 8 bars, but hold the bassline and main hook back until the intro ends.
- **Keep a steady tempo.** Avoid tempo changes or loose, swung drums in the intro.

## Building the outro

- **Mirror the intro.** Strip the track back to drums and percussion for the last 16 to 32 bars.
- **Remove the bass and vocals first,** so the next track can take over the low end cleanly.
- **Avoid long reverb tails and fade-outs** over the final bars. A clean, rhythmic ending is much easier to mix out of.

> **Think in phrases:** Build the whole track in 8-bar blocks, with major changes on the first beat of a 16- or 32-bar phrase. DJs mix phrase to phrase, and a predictable structure makes your track feel right in a mix.

## Make an extended mix and a radio edit

Many producers release two versions: an **extended mix** with full DJ intros and outros, and a shorter **radio edit** for streaming playlists. If you only make one version, make it the extended mix.

## Export like a pro

- Export at a steady tempo, with no fades at the start or end.
- Use a lossless format (WAV or AIFF), at 24-bit where possible.
- Name files clearly and tag the BPM and key so DJs can file them fast.

For a hands-on walkthrough of rearranging a track, see our guide to [making your first DJ edit in Ableton Live](/blog/make-your-first-edit-in-ableton). Get these details right and your music will slide into sets effortlessly, which is exactly how it ends up played in clubs.', 'music-production', array['music production', 'djfriendly', 'intros', 'outros', 'tracks']::text[], '/images/blog/dj-friendly-intros-and-outros.jpg', 'published', '2026-07-27T09:00:00Z', (select id from public.instructors where slug = 'sofia-martins')
on conflict (slug) do nothing;

insert into public.blog_posts (slug, title, excerpt, body, category, keywords, cover, status, publish_at, author_id)
select 'protect-your-hearing', 'Protect Your Ears: Hearing Safety Every DJ Should Know', 'Your ears are your most important piece of DJ gear, and hearing damage is permanent. Here''s how loud is too loud, and the simple habits that protect your career.', 'You can replace a broken controller or a cracked laptop screen. Ears are different: noise-induced hearing loss and tinnitus (ringing in the ears) are permanent. The good news is that they''re also largely preventable, and protecting your hearing won''t make your sets any less exciting.

## How loud is too loud?

Sound is measured in decibels (dB) on a logarithmic scale: every 3 dB increase roughly doubles the sound energy. The US National Institute for Occupational Safety and Health (NIOSH) recommends limiting exposure to 85 dBA over an eight-hour day, and halving the safe time for every 3 dB above that:

- **85 dBA:** about 8 hours
- **91 dBA:** about 2 hours
- **97 dBA:** about 30 minutes
- **100 dBA:** about 15 minutes

Club dance floors and DJ booths can easily go past 100 dB, so a single long set without protection can take you well beyond those limits.

## Warning signs

- Ringing, buzzing or hissing in your ears after a gig.
- Sounds seeming muffled or dull the next morning.
- Struggling to follow conversations in noisy places.

Temporary symptoms are a sign your ears were overexposed. Repeated overexposure can cause lasting damage.

## Habits that protect your ears

### Wear earplugs designed for music

Musician''s earplugs reduce volume evenly across frequencies, so music still sounds natural, just quieter. Custom-molded plugs from an audiologist are the gold standard for working DJs, but good universal-fit versions are a great start.

### Control your booth monitor

Many DJs push the booth monitor louder and louder as the night goes on. Set it at the start of your set to a level that''s clear but comfortable, and resist the urge to creep it up.

### Be smart with headphones

Keep your headphone volume as low as you can while still cueing clearly. Cue with one ear and keep the other on the booth monitor, and take your headphones off between transitions.

### Give your ears a rest

During long events, take breaks away from the loudest areas, and allow some quiet recovery time after a loud night.

> **Get tested:** Book a baseline hearing test with an audiologist, then check in regularly so you can catch changes early. If you notice sudden hearing loss or ringing that doesn''t go away, see a professional promptly.

Protecting your hearing is how you make sure you''ll still be enjoying music, and playing it, decades from now.', 'practice-wellbeing', array['practice & wellbeing', 'protect', 'hearing', 'safety', 'should']::text[], '/images/blog/protect-your-hearing.jpg', 'published', '2026-07-22T09:00:00Z', (select id from public.instructors where slug = 'leo-moreno')
on conflict (slug) do nothing;

-- Challenges ────────────────────────────────────────────────────────────────

insert into public.challenges (slug, title, tagline, type, difficulty, opens, closes, image, prize, brief, rules, judging, inspiration, winners, published, sample_entries)
values ('baby-scratch-bootcamp', 'Baby Scratch Bootcamp', 'One scratch, 60 seconds, total control.', 'scratch', 'Beginner', '2026-09-15', '2026-10-18', '/images/courses/scratch-school.jpg', 'Free Scratch School course + featured on our socials', 'Every great scratch DJ started with the baby scratch. Record 60 seconds of baby scratches over a steady beat, showing clean rhythm, varied patterns and tight timing. No transforms, no fader tricks: just your hand, the record and the beat.',
  array['Use only the baby scratch (hand on the record, no crossfader cuts).', 'Keep it to 60 seconds, recorded in one take.', 'Any beat between 85 and 100 BPM.', 'Show your hands on the platter or jog wheel in the video.', 'Upload to YouTube (public or unlisted) and submit the link.']::text[], '[{"label":"Timing & rhythm","weight":50},{"label":"Sound quality & control","weight":30},{"label":"Creativity","weight":20}]'::jsonb, '[{"youtube":"https://www.youtube.com/watch?v=FVshXe200RI","title":"2026 DMC Scratch Wildcard champion","dj":"Chell (Russia)","note":"Pure scratch technique: tone, rhythm and control."},{"youtube":"https://www.youtube.com/watch?v=lrXFmNjNQZ0","title":"2023 DMC World Champion winning routine","dj":"K-Swizz (New Zealand)","note":"Watch how every cut lands exactly on the beat, even at full speed."}]'::jsonb, null, true, 148)
on conflict (slug) do nothing;

insert into public.challenges (slug, title, tagline, type, difficulty, opens, closes, image, prize, brief, rules, judging, inspiration, winners, published, sample_entries)
values ('one-minute-house-blend', 'The One-Minute House Blend', 'Two tracks. One seamless minute.', 'mixing', 'Beginner', '2026-09-22', '2026-10-25', '/images/courses/house-techno-mixing.jpg', 'Resident plan free for a year + mix feedback from Leo Moreno', 'Blend two house tracks so smoothly that nobody could say where one ends and the next begins. Show a clean beatmatch, a well-timed bass swap and a transition that lands on the phrase.',
  array['Exactly two house tracks, blended in one continuous take.', 'At least 60 seconds of the tracks playing together.', 'Any gear: controller, CDJs or turntables.', 'No pre-made mixes, loops or edits of the blend.', 'Submit a YouTube link showing your hands and your mixer.']::text[], '[{"label":"Beatmatch & phrasing","weight":40},{"label":"EQ and sound","weight":40},{"label":"Track selection","weight":20}]'::jsonb, '[{"youtube":"https://www.youtube.com/watch?v=fmVPTmOnNQg","title":"Red Bull Thre3style 2016 World Finals winning set","dj":"DJ Puffy","note":"Tight transitions and big moments, all in fifteen minutes."},{"youtube":"https://www.youtube.com/watch?v=TnHqMVAX-c0","title":"Red Bull 3Style 2018 World Champion winning set","dj":"DJ Damianito","note":"Genre-hopping with perfect crowd energy from start to finish."}]'::jsonb, null, true, 96)
on conflict (slug) do nothing;

insert into public.challenges (slug, title, tagline, type, difficulty, opens, closes, image, prize, brief, rules, judging, inspiration, winners, published, sample_entries)
values ('amapiano-log-drum-switch', 'Amapiano Log Drum Switch', 'Swap the log drum, keep the groove.', 'genre', 'Intermediate', '2026-09-10', '2026-10-12', '/images/courses/afrobeats-amapiano-mixing.jpg', 'Afrobeats & Amapiano course + a guest mix slot on our stream', 'Amapiano is all about patience. Build a 3-minute mini-set of amapiano with at least two transitions, using clean log drum swaps so the bass never doubles up and the groove never drops.',
  array['3 minutes, at least three amapiano tracks.', 'At least two transitions, both with a clean low-end swap.', 'Tempo between 108 and 116 BPM.', 'Record in one take and submit a YouTube link.']::text[], '[{"label":"Low-end control","weight":40},{"label":"Groove & flow","weight":35},{"label":"Selection","weight":25}]'::jsonb, '[{"youtube":"https://www.youtube.com/watch?v=R8vh_xFAIvc","title":"Red Bull 3Style World Finals 2019 set","dj":"DJ Afro","note":"Selection that tells a story and keeps surprising the room."},{"youtube":"https://www.youtube.com/watch?v=TnHqMVAX-c0","title":"Red Bull 3Style 2018 World Champion winning set","dj":"DJ Damianito","note":"Genre-hopping with perfect crowd energy from start to finish."}]'::jsonb, null, true, 211)
on conflict (slug) do nothing;

insert into public.challenges (slug, title, tagline, type, difficulty, opens, closes, image, prize, brief, rules, judging, inspiration, winners, published, sample_entries)
values ('transform-and-flare-battle', 'Transform & Flare Battle', 'Crossfader cuts, full speed.', 'scratch', 'Advanced', '2026-10-20', '2026-11-22', '/images/blog/crate-digging.jpg', 'Headliner plan for life + a scratch session with Marcus Reid', 'Take it to the fader. Put together a 90-second scratch routine built around transforms and flares, with a clear structure: intro, build and a finishing combo that makes judges rewind.',
  array['90 seconds maximum, recorded in one take.', 'Must include transforms and at least one flare pattern.', 'Show both hands clearly throughout.', 'Original routine: no copied routines from other DJs.']::text[], '[{"label":"Technique","weight":45},{"label":"Musicality","weight":30},{"label":"Originality","weight":25}]'::jsonb, '[{"youtube":"https://www.youtube.com/watch?v=irQXrpQdv_Y","title":"2018 DMC World Championship winning routine","dj":"DJ Skillz","note":"A masterclass in routine structure: every section builds on the last."},{"youtube":"https://www.youtube.com/watch?v=hUcH9LLqPpA","title":"DMC World DJ Championships 2019 winning routine","dj":"DJ Matsunaga","note":"Creative sample choice and flawless precision under pressure."}]'::jsonb, null, true, 0)
on conflict (slug) do nothing;

insert into public.challenges (slug, title, tagline, type, difficulty, opens, closes, image, prize, brief, rules, judging, inspiration, winners, published, sample_entries)
values ('three-genre-open-format', 'Three-Genre Open Format', 'Hip-hop, Afrobeats, house. Five minutes.', 'transitions', 'Intermediate', '2026-11-01', '2026-12-06', '/images/courses/open-format-djing.jpg', 'Open-Format course + a feature in our newsletter', 'Show you can move a crowd between worlds. Mix hip-hop, Afrobeats and house in a 5-minute set, with transitions that feel natural even when the tempo and genre change completely.',
  array['5 minutes, with all three genres in any order.', 'At least two genre changes with a tempo shift.', 'Clean versions only: this is a party-friendly set.', 'Submit one continuous take as a YouTube link.']::text[], '[{"label":"Transitions","weight":45},{"label":"Energy & flow","weight":35},{"label":"Selection","weight":20}]'::jsonb, '[{"youtube":"https://www.youtube.com/watch?v=TnHqMVAX-c0","title":"Red Bull 3Style 2018 World Champion winning set","dj":"DJ Damianito","note":"Genre-hopping with perfect crowd energy from start to finish."},{"youtube":"https://www.youtube.com/watch?v=OUJA3TkyFRI","title":"Red Bull 3Style World Finals 2019 full set","dj":"Eskei83","note":"Huge energy and creative blends across bass, trap and future bass."}]'::jsonb, null, true, 0)
on conflict (slug) do nothing;

insert into public.challenges (slug, title, tagline, type, difficulty, opens, closes, image, prize, brief, rules, judging, inspiration, winners, published, sample_entries)
values ('juggle-the-break', 'Juggle the Break', 'Two copies. One brand-new groove.', 'scratch', 'Advanced', '2026-07-01', '2026-08-10', '/images/courses/vinyl-djing-essentials.jpg', 'Headliner plan for life', 'Beat juggling turns two copies of a break into something new. Entrants built 60-second juggles that rearranged a classic break into original patterns.',
  array['60 seconds, two copies of the same break.', 'No looping features or sync.', 'One continuous take.']::text[], '[{"label":"Precision","weight":50},{"label":"Creativity","weight":30},{"label":"Musicality","weight":20}]'::jsonb, '[{"youtube":"https://www.youtube.com/watch?v=bFlkhnPfU3Y","title":"DMC World Championship winning routine","dj":"DJ Vekked","note":"Beat juggling so clean it sounds like a new record."},{"youtube":"https://www.youtube.com/watch?v=44F0d2CbjM0","title":"2016 DMC Online Finals winning routine","dj":"DJ Brace","note":"Proof that a great routine can be recorded at home."}]'::jsonb, '[{"place":1,"name":"Kofi A.","avatar":"/images/students/student-4.jpg","city":"Accra"},{"place":2,"name":"Lena M.","avatar":"/images/students/student-2.jpg","city":"Berlin"},{"place":3,"name":"Ravi P.","avatar":"/images/students/student-1.jpg","city":"Toronto"}]'::jsonb, true, 184)
on conflict (slug) do nothing;

insert into public.challenges (slug, title, tagline, type, difficulty, opens, closes, image, prize, brief, rules, judging, inspiration, winners, published, sample_entries)
values ('festival-drop-remix', 'Festival Drop Moment', 'Build it up. Drop it big.', 'transitions', 'Intermediate', '2026-05-15', '2026-06-20', '/images/courses/festival-sets.jpg', 'Festival Sets course + mentoring call', 'Entrants built a 2-minute moment that a festival crowd would never forget: a tension-building transition that ends on a huge drop.',
  array['2 minutes maximum.', 'One transition into a drop.', 'One continuous take.']::text[], '[{"label":"Build & tension","weight":40},{"label":"Drop impact","weight":40},{"label":"Technique","weight":20}]'::jsonb, '[{"youtube":"https://www.youtube.com/watch?v=OUJA3TkyFRI","title":"Red Bull 3Style World Finals 2019 full set","dj":"Eskei83","note":"Huge energy and creative blends across bass, trap and future bass."},{"youtube":"https://www.youtube.com/watch?v=fmVPTmOnNQg","title":"Red Bull Thre3style 2016 World Finals winning set","dj":"DJ Puffy","note":"Tight transitions and big moments, all in fifteen minutes."}]'::jsonb, '[{"place":1,"name":"Sam O.","avatar":"/images/students/student-5.jpg","city":"London"},{"place":2,"name":"Nia K.","avatar":"/images/students/student-3.jpg","city":"Nairobi"},{"place":3,"name":"Diego R.","avatar":"/images/students/student-1.jpg","city":"Madrid"}]'::jsonb, true, 237)
on conflict (slug) do nothing;

-- Site settings ─────────────────────────────────────────────────────────────

insert into public.site_settings (id, data) values ('site', '{"general":{"siteName":"Ultimate Deejays","tagline":"Learn to DJ online, from your first mix to your first booking.","supportEmail":"hello@ultimatedeejays.com","phone":"+1 (310) 555-0142","address":"Studio 7, Soundwave House, Los Angeles, CA","currency":"USD","socials":{"instagram":"https://www.instagram.com/ultimatedeejays","tiktok":"https://www.tiktok.com/@ultimatedeejays","youtube":"https://www.youtube.com/@ultimatedeejays","x":"https://x.com/ultimatedeejays"}},"plans":[{"slug":"warm-up","name":"Warm-Up","tagline":"Get your hands on the decks and find your sound.","price":0,"cta":"Start free","featured":false,"highlights":["DJ Fundamentals course","Free lessons from every category","Enter beginner challenges","Community access","Progress tracking & lesson notes"]},{"slug":"resident","name":"Resident","tagline":"Everything you need to play your first real gigs.","price":79,"cta":"Become a Resident","featured":true,"highlights":["Everything in Warm-Up","All Beginner & Intermediate courses","Practice tracks, stems & cue sheets","Enter every challenge","Certificates of completion","Mix feedback on 2 recordings"]},{"slug":"headliner","name":"Headliner","tagline":"The full library and direct coaching from working DJs.","price":149,"cta":"Go Headliner","featured":false,"highlights":["Everything in Resident","Every course, including Advanced","All future courses included","Unlimited mix feedback","Monthly live Q&A with instructors","Press-kit & booking review"]}],"pricing":{"heading":"Pay once. Keep mixing forever.","intro":"No subscriptions and no monthly fees. Start free, then unlock the courses you need when you''re ready to level up.","guaranteeDays":30,"showComparison":true,"upgradeCredit":true},"blog":{"heading":"Latest posts","postsPerPage":12,"defaultCategory":"mixing-techniques","featuredPost":"","homeLatest":6,"showAuthorBox":true,"showRelated":true,"showNewsletter":true,"showReadingProgress":true,"showShare":true},"payments":{"card":true,"paypal":true,"schedule":"monthly","minimum":100,"destination":"Bank •••• 4821","refundWindow":30},"affiliates":{"enabled":true,"defaultCommission":20,"cookieDays":30,"minPayout":50,"autoApprove":false,"terms":"Promote Ultimate Deejays honestly. No paid ads on our brand name, no coupon sites and no spam. Commission is paid monthly on sales that aren''t refunded."},"notifications":{"email":"hello@ultimatedeejays.com","newSale":true,"refund":true,"newStudent":false,"affiliateApplication":true,"payoutSent":true,"weeklyReport":true}}'::jsonb)
on conflict (id) do nothing;

commit;
