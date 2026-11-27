-- Run once in the Washim Lab Supabase project's SQL Editor.
-- Repeat runs preserve all existing edits and publication settings.
begin;

do $$
declare
  owner_id uuid;
  guide_count integer;
begin
  select user_id into strict owner_id
  from public.admin_users;

  with legacy(id, title, original_date, show_latest) as (
    values
    ('1Cjb55cA85Ff4u-GQ2Ar7-Wat5EVpU8Lj', 'My AI Stack', '2026-11-25T17:27:19.039Z'::timestamptz, true),
    ('1Pnk7UeYZSHhnKUPvhQH-JiuwKSujRfYc', 'Claude Animation Styles Prompt Pack', '2026-11-25T16:29:28.401Z'::timestamptz, true),
    ('1NaDPm5fcrg36wsJLMWC480XYeBoQoGmV', 'AI Tools Pyramid techwithnandini', '2026-11-23T14:26:26.174Z'::timestamptz, true),
    ('1kOAdpTG17-ARaIy7HAKRIZXgliENRAXr', '10 – Everyday – AI – Tools', '2026-11-21T13:23:51.096Z'::timestamptz, true),
    ('1e0FTXpt2saj-CfCQq7ci7WlYODvHcA1C', '6 AI Agents Ranked – techwithnandini.ai', '2026-11-20T03:56:53.107Z'::timestamptz, true),
    ('1YzKy-TiumdZfdguhbKF-eirs0LAYlCPt', '100 ChatGPT Image Shortcuts', '2026-11-19T04:16:12.989Z'::timestamptz, true),
    ('1-Z7c4ULrqOBgy7pEeoRI3-r85Ip6AViu', 'Claude Video Editor Repos', '2026-11-16T14:15:47.352Z'::timestamptz, true),
    ('1fGF1JxdHkKCeAVm83d7kNyQSNO2oviWl', 'Build An App With AI Step By Step Guide', '2026-11-10T16:39:41.979Z'::timestamptz, true),
    ('1SCTUXCeQQxRgyPUeLdr5m0beNAlwx2re', 'Learn AI', '2026-11-04T18:06:09.652Z'::timestamptz, false),
    ('1J5eoVft0ZOkfmoKEYgYQ7ddWxJxcy3N1', '10 GitHub Cheat Codes', '2026-10-31T02:02:48.732Z'::timestamptz, false),
    ('1-fq0MEabMkDIaunFvbaNANtSAgN01eHR', 'AI Tools for Students', '2026-10-26T03:30:04.756Z'::timestamptz, false),
    ('1W7p8fH-QiGtZFZVEhTGOUJrF7dENScdi', 'Free AI Tools 2026', '2026-10-26T03:27:20.156Z'::timestamptz, false),
    ('1dgNl3xsb3CcTU4LCr1R1ZmJB7cz4bfLv', '5 Levels of AI Users', '2026-10-20T15:08:31.133Z'::timestamptz, false),
    ('12Lma2rmUVl_-7Os8CPdeXz8tOtDDuuHy', '10-crazy-gemini-4-argon-builds', '2026-10-14T23:33:26.898Z'::timestamptz, false),
    ('1oSL6plTfieFoAGnMarA_lMRpVep1m6dc', '4 AI Projects – All the Prompts', '2026-10-14T15:14:33.680Z'::timestamptz, false),
    ('1YgRmj0cMdyUGFYGOotYEPMrYNfiOVlam', '5 Free AI Tools – Lead Magnet', '2026-10-13T02:19:25.511Z'::timestamptz, false),
    ('1087ow-Qt1nfFQGTGPdYCaj878MBibKH7', 'AI-learning-path', '2026-10-10T12:17:33.644Z'::timestamptz, false),
    ('1SvVOiF6UpbVh7rMW7JcLMYomycewcuyB', '4 AI AGENTS guide', '2026-10-08T14:42:14.504Z'::timestamptz, false),
    ('16KjnPlCvbEutzF05ah2x9wyrxiT5DR2G', 'Story-to – Video – Workflow – Tech-with – Nandini', '2026-10-07T21:30:34.422Z'::timestamptz, false),
    ('1arFu9m5nHKo8n25qp7iL2V2NSNtkE0f5', '10 Real Use Cases for OpenAI Dots', '2026-09-30T15:02:16.255Z'::timestamptz, false),
    ('1sCq2Wy71nUcDV-blpI8I73x4OKcTeMOX', 'ai-iceberg-10-free-resources', '2026-09-26T17:10:44.432Z'::timestamptz, false),
    ('1S0EqaSv_i_EKoYG242T58cTJRdYCzor_', 'Tech with Nandini Job Portals Guide', '2026-09-24T03:11:27.794Z'::timestamptz, false),
    ('1B3qOtdFOJV5fx2dSp1bDoogW64b6GjYp', 'Meta AI 10 Prompts Tech with Nandini', '2026-09-19T04:27:14.742Z'::timestamptz, false),
    ('1kst9ATshMp8LSQpcqDHbYYLuZTDYvtSY', 'AI – Property – Video – Method – Tech-with – Nandini', '2026-09-17T03:17:13.873Z'::timestamptz, false),
    ('1e9a7g5DYihAuYVCqeja9Bf04t7E3Jsyw', 'job-hunt-toolkit-white', '2026-09-15T02:57:02.484Z'::timestamptz, false),
    ('1DglqOH_fGKnGZeq_Rx4nD0M20m4qi5YA', 'GLM-5.3 – Flash – Guide – Light', '2026-09-14T03:59:49.555Z'::timestamptz, false),
    ('1Umnv74qjOLkyuCC1k9iWv_QPB411ZxGc', '80s AI Photo Prompt Pack', '2026-09-10T23:50:38.168Z'::timestamptz, false),
    ('1psbxZyEs3-7NdDlF6KyT04nSeYvXHj3F', '3 websites to try GPT6 Astra for free', '2026-09-09T16:05:39.216Z'::timestamptz, false),
    ('1fTOLs_4wbLEVaqUuhu1uyWF9iHENIu94', 'Tech with Nandini Claude Resume Prompts', '2026-09-08T02:59:32.651Z'::timestamptz, false),
    ('1INQeb5ByyvU-SDTSRjyCBjgWD6evuJ8c', 'Ganesh Chaturthi Image Prompts', '2026-09-07T19:53:05.944Z'::timestamptz, false),
    ('1xwAUVuCWH88tSa9Q6CFHMyfwL84q4ckM', 'GenZ Anime Sticker Pack Prompts', '2026-09-06T05:12:03.996Z'::timestamptz, false),
    ('1PcLDgi-uTTpeCtz4vQlkQSrqU4Xpqce7', '3 – AI – Certifications – Sept – Roadmap – TechwithNandini', '2026-09-04T20:15:23.023Z'::timestamptz, false),
    ('1ZJnK-jX4NZvGbJOb5BHgFJzH1JsqTJxv', 'Top AI Certificates Tier List', '2026-09-02T04:03:54.061Z'::timestamptz, false),
    ('1sEXeDhiLyykP4LSpxLGWUr2MCV7rm7ZK', 'Nemotron 3 5 Lightning OpenCode Setup Guide TechWithNandini', '2026-08-30T13:26:31.095Z'::timestamptz, false),
    ('1HPDUVd8b_tgwS4w_0kzyTmE22K77pnIo', 'Muse – Glimmer – Setup – Guide – TechWithNandini', '2026-08-29T12:53:29.918Z'::timestamptz, false),
    ('1Y_4Yx1PiHEfUVR8v1DbD8Jt2dnnh47xu', '100 – Skills – Tech-with – Nandini', '2026-08-27T14:54:52.814Z'::timestamptz, false),
    ('1AzVYWIlKRLWORkHmn9Ngc6q6z-37R4bW', '3 AI Websites', '2026-08-26T06:46:55.233Z'::timestamptz, false),
    ('1q0DmitC5-XtujxJT1W1EDsn747w9ZzUP', 'My – Top-9 – AI – Tools – Ranked – Tech-with – Nandini', '2026-08-23T02:47:40.040Z'::timestamptz, false),
    ('1qrqtIOkw-_vi4Z2OkxqK3ms65YPIKD-J', 'Google-15 – AI – Tools – Tech-with – Nandini', '2026-08-22T02:38:17.001Z'::timestamptz, false),
    ('1EmUKTEiRfHpa1UjLz8mIROhpmN_Mgb3V', 'tech-with-nandini-seedance-prompts', '2026-08-21T12:15:19.482Z'::timestamptz, false),
    ('1ACzZuPMRDzyJ1qT--uvNDYj2DFPGN991', 'learn-any-topic-with-live-ai-artifacts', '2026-08-11T03:46:34.102Z'::timestamptz, false),
    ('16n4tsPhanwGDG2NVs5Qt8hk_Twk0-Dmv', 'Tech with Nandini Digital Footprint Prompts', '2026-08-10T03:02:13.972Z'::timestamptz, false),
    ('1VEAkPbIH_LL6Bu3a9SHM5pDiX4vaLPQR', '100 ChatGPT Secret Codes Tech with Nandini', '2026-08-04T04:09:37.759Z'::timestamptz, false),
    ('1yHzzFSOc9Pil1HGejev6vsWuOFBJMxGy', 'SkyReels One Page Setup Guide Tech with Nandini', '2026-08-01T03:14:07.579Z'::timestamptz, false),
    ('1FBEBJKxYNbpDVTpi74CYDonnvLuJrBrm', 'Claude Humanizer 1 Page Setup Guide Tech with Nandini', '2026-07-31T03:56:44.488Z'::timestamptz, false),
    ('1d5BiC2dslz8HK4ev72U7kYeLqOHTEPGr', 'ChatGPT Job Hunt Pack Tech with Nandini', '2026-07-30T02:42:27.564Z'::timestamptz, false),
    ('16tBjOIzh1gNwkCHWr-PyXYQgKCDpbsFT', 'Kimi – K3 – Build – Prompts', '2026-07-28T03:51:58.156Z'::timestamptz, false),
    ('1GTI2XiJ_JpdXE7C363Xd_z3g3Cdm4J7b', 'Tech-with – Nandini – Gemini – Omni – Flash – Prompts', '2026-07-23T23:22:21.693Z'::timestamptz, false),
    ('1UAnFPuu3QnauXyH5xWelA7zLGgM68el0', '50 – ChatGPT – Secret – Codes – Tech-with – Nandini', '2026-07-23T02:19:08.147Z'::timestamptz, false),
    ('1LPztj_5lDeszK6BeXakEn_cB3cYLbrJy', 'Google Omni Flash 10 Prompts TechWithNandini', '2026-07-22T03:19:44.439Z'::timestamptz, false),
    ('1mVLAr2YmV9a_RyhUq4c769jWsNsLEMJ0', '9-to-5 – AI-tools', '2026-07-21T03:45:24.524Z'::timestamptz, false),
    ('1fqYSKpICCcS9zkqr5n-5o82OAA12zXuO', 'InTruth Guide TechWithNandini', '2026-07-20T03:20:37.845Z'::timestamptz, false),
    ('1BxeyjUebqE_iTkFbO1Tjsiqz6BDu7ZL2', 'TechWithNandini Top10 AI Tools', '2026-07-17T03:50:55.370Z'::timestamptz, false),
    ('13kuC6g4_Ve8WpO473DTXsp2t0zo-VgvW', 'Fable5 vs GPT56 Sol Short Comparison and Prompt', '2026-07-14T03:23:53.921Z'::timestamptz, false),
    ('1HGFJO1bY4eI65mUdQOQT_jb4ZTVlQeGl', 'Fable5 vs GPT56 Sol Wild West Prompt', '2026-07-14T03:19:43.181Z'::timestamptz, false),
    ('1u8eCE4rnS_GI1rtfQglnOK_dvlOMPe0H', 'codex-inside-chatgpt-workflow-automation-guide', '2026-07-13T17:07:03.973Z'::timestamptz, false),
    ('1NMW4HKaOgC0B1PLDPoR3-OCUfe8Lz6kE', 'LongCat – Avatar – Free – Open – Source – Guide', '2026-07-13T02:17:03.599Z'::timestamptz, false),
    ('1irTT2LgxZHvw-8daw_5do7j25_giTQJG', 'Claude NotebookLM Setup Guide', '2026-07-10T22:19:26.675Z'::timestamptz, false),
    ('1kO1o7xS3ILtcWph0qXR_XLjNUxG_m1VZ', 'Claude Job Pack TechWithNandini', '2026-07-10T21:44:59.866Z'::timestamptz, false),
    ('1nGrwS5nEgkCrjF5D-YeO1u6A4Wpl2wSR', 'Tech with Nandini VIBE Emergent Master Prompt', '2026-07-04T18:36:51.954Z'::timestamptz, false),
    ('10DIOeEHH0PO4A4SmfzZySaSOcmGvE4fj', 'Fable5 Guide', '2026-07-03T15:29:36.637Z'::timestamptz, false),
    ('1-kMszPMgoqu28u2okm-kfwlb62ve0LBF', '4 free tools tech with nandini', '2026-06-29T03:02:41.034Z'::timestamptz, false),
    ('1lzHzf7wKTCv0wxWsrS--_lzfbjpX4u39', 'Tech with Nandini SMART Websites', '2026-06-28T04:05:37.170Z'::timestamptz, false)
  )
  insert into public.posts (
    legacy_id, title, kind, file_url, cover_url, status,
    show_latest, created_by, created_at, published_at
  )
  select id, title, 'pdf', '/free/pdf/' || id || '.pdf',
    '/free/cover/' || id || '.jpg', 'published',
    show_latest, owner_id, original_date, original_date
  from legacy
  on conflict (legacy_id) do nothing;

  select count(*) into guide_count
  from public.posts where legacy_id in ('1Cjb55cA85Ff4u-GQ2Ar7-Wat5EVpU8Lj', '1Pnk7UeYZSHhnKUPvhQH-JiuwKSujRfYc', '1NaDPm5fcrg36wsJLMWC480XYeBoQoGmV', '1kOAdpTG17-ARaIy7HAKRIZXgliENRAXr', '1e0FTXpt2saj-CfCQq7ci7WlYODvHcA1C', '1YzKy-TiumdZfdguhbKF-eirs0LAYlCPt', '1-Z7c4ULrqOBgy7pEeoRI3-r85Ip6AViu', '1fGF1JxdHkKCeAVm83d7kNyQSNO2oviWl', '1SCTUXCeQQxRgyPUeLdr5m0beNAlwx2re', '1J5eoVft0ZOkfmoKEYgYQ7ddWxJxcy3N1', '1-fq0MEabMkDIaunFvbaNANtSAgN01eHR', '1W7p8fH-QiGtZFZVEhTGOUJrF7dENScdi', '1dgNl3xsb3CcTU4LCr1R1ZmJB7cz4bfLv', '12Lma2rmUVl_-7Os8CPdeXz8tOtDDuuHy', '1oSL6plTfieFoAGnMarA_lMRpVep1m6dc', '1YgRmj0cMdyUGFYGOotYEPMrYNfiOVlam', '1087ow-Qt1nfFQGTGPdYCaj878MBibKH7', '1SvVOiF6UpbVh7rMW7JcLMYomycewcuyB', '16KjnPlCvbEutzF05ah2x9wyrxiT5DR2G', '1arFu9m5nHKo8n25qp7iL2V2NSNtkE0f5', '1sCq2Wy71nUcDV-blpI8I73x4OKcTeMOX', '1S0EqaSv_i_EKoYG242T58cTJRdYCzor_', '1B3qOtdFOJV5fx2dSp1bDoogW64b6GjYp', '1kst9ATshMp8LSQpcqDHbYYLuZTDYvtSY', '1e9a7g5DYihAuYVCqeja9Bf04t7E3Jsyw', '1DglqOH_fGKnGZeq_Rx4nD0M20m4qi5YA', '1Umnv74qjOLkyuCC1k9iWv_QPB411ZxGc', '1psbxZyEs3-7NdDlF6KyT04nSeYvXHj3F', '1fTOLs_4wbLEVaqUuhu1uyWF9iHENIu94', '1INQeb5ByyvU-SDTSRjyCBjgWD6evuJ8c', '1xwAUVuCWH88tSa9Q6CFHMyfwL84q4ckM', '1PcLDgi-uTTpeCtz4vQlkQSrqU4Xpqce7', '1ZJnK-jX4NZvGbJOb5BHgFJzH1JsqTJxv', '1sEXeDhiLyykP4LSpxLGWUr2MCV7rm7ZK', '1HPDUVd8b_tgwS4w_0kzyTmE22K77pnIo', '1Y_4Yx1PiHEfUVR8v1DbD8Jt2dnnh47xu', '1AzVYWIlKRLWORkHmn9Ngc6q6z-37R4bW', '1q0DmitC5-XtujxJT1W1EDsn747w9ZzUP', '1qrqtIOkw-_vi4Z2OkxqK3ms65YPIKD-J', '1EmUKTEiRfHpa1UjLz8mIROhpmN_Mgb3V', '1ACzZuPMRDzyJ1qT--uvNDYj2DFPGN991', '16n4tsPhanwGDG2NVs5Qt8hk_Twk0-Dmv', '1VEAkPbIH_LL6Bu3a9SHM5pDiX4vaLPQR', '1yHzzFSOc9Pil1HGejev6vsWuOFBJMxGy', '1FBEBJKxYNbpDVTpi74CYDonnvLuJrBrm', '1d5BiC2dslz8HK4ev72U7kYeLqOHTEPGr', '16tBjOIzh1gNwkCHWr-PyXYQgKCDpbsFT', '1GTI2XiJ_JpdXE7C363Xd_z3g3Cdm4J7b', '1UAnFPuu3QnauXyH5xWelA7zLGgM68el0', '1LPztj_5lDeszK6BeXakEn_cB3cYLbrJy', '1mVLAr2YmV9a_RyhUq4c769jWsNsLEMJ0', '1fqYSKpICCcS9zkqr5n-5o82OAA12zXuO', '1BxeyjUebqE_iTkFbO1Tjsiqz6BDu7ZL2', '13kuC6g4_Ve8WpO473DTXsp2t0zo-VgvW', '1HGFJO1bY4eI65mUdQOQT_jb4ZTVlQeGl', '1u8eCE4rnS_GI1rtfQglnOK_dvlOMPe0H', '1NMW4HKaOgC0B1PLDPoR3-OCUfe8Lz6kE', '1irTT2LgxZHvw-8daw_5do7j25_giTQJG', '1kO1o7xS3ILtcWph0qXR_XLjNUxG_m1VZ', '1nGrwS5nEgkCrjF5D-YeO1u6A4Wpl2wSR', '10DIOeEHH0PO4A4SmfzZySaSOcmGvE4fj', '1-kMszPMgoqu28u2okm-kfwlb62ve0LBF', '1lzHzf7wKTCv0wxWsrS--_lzfbjpX4u39');
  if guide_count <> 63 then
    raise exception 'Expected 63 imported guides, found %', guide_count;
  end if;
end $$;

-- A successful import and the public feed switch commit together.
create or replace function public.legacy_catalog_managed()
returns boolean language sql immutable set search_path = ''
as $$ select true $$;
revoke all on function public.legacy_catalog_managed() from public;
grant execute on function public.legacy_catalog_managed() to anon, authenticated;

commit;

select count(*) as imported_guides from public.posts where legacy_id is not null;
