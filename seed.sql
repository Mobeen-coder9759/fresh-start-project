-- =============================================================
-- SEED DATA FOR DENTAL DASHBOARD
-- Run this against your Heroku Postgres database.
-- It is safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================

-- 1. Clinic
INSERT INTO clinics (id, name)
VALUES (1, 'Bright Smile Dental')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('clinics_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clinics));

-- 2. Clinic settings
INSERT INTO clinic_settings (clinic_id, appointment_value, hourly_cost, minutes_per_booking, timezone)
VALUES (1, 180, 22, 6, 'America/New_York')
ON CONFLICT (clinic_id) DO UPDATE SET
  appointment_value = EXCLUDED.appointment_value,
  hourly_cost = EXCLUDED.hourly_cost,
  minutes_per_booking = EXCLUDED.minutes_per_booking,
  timezone = EXCLUDED.timezone;

-- 3. Users
-- dr.carter    password: Admin1234!
-- sophie.front password: Staff1234!
-- oliver.desk  password: Staff1234!
-- grace.hr     password: HR1234!
INSERT INTO app_users (id, username, password_hash, name, role, clinic_id, is_active)
VALUES
  (1, 'dr.carter',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lihO', 'Dr. Emily Carter', 'admin', 1, true),
  (2, 'sophie.front', '$2a$10$RrSm3M0FkNWAH58yqIv9/OW6IXH1K5Caq.P2jREi3rLpkmKn.o0e6', 'Sophie Bennett',   'staff', 1, true),
  (3, 'oliver.desk',  '$2a$10$RrSm3M0FkNWAH58yqIv9/OW6IXH1K5Caq.P2jREi3rLpkmKn.o0e6', 'Oliver Hughes',    'staff', 1, true),
  (4, 'grace.hr',     '$2a$10$kBGk2bJGrxNjZI/PksFJGeIZGF.bFkGdOuwHnDiGBQh4qP2LT6p8y', 'Grace Mitchell',   'hr',    1, true)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  clinic_id = EXCLUDED.clinic_id,
  is_active = EXCLUDED.is_active;

SELECT setval('app_users_id_seq', (SELECT MAX(id) FROM app_users));

-- 4. Appointments (50 rows: past/completed, rescheduled, cancelled, upcoming)
INSERT INTO appointments (
  clinic_id, name, phone, email, dob, insurance,
  reason, booking_type, booking_time, old_time, cancel_time
) VALUES
-- PAST completed
(1,'Emma Johnson',    '+1 555 100 1001','emma.johnson@example.com',   '1988-04-12','Delta Dental 4471-2280-1234','Cleaning',        'new',        NOW()-INTERVAL'85 days',NULL,NULL),
(1,'Liam Smith',      '+1 555 101 1002','liam.smith@example.com',     '1975-09-30','Cigna DPPO 9910-3385-5521', 'Checkup',         'new',        NOW()-INTERVAL'80 days',NULL,NULL),
(1,'Olivia Brown',    '+1 555 102 1003','olivia.brown@example.com',   '1992-01-22','MetLife 2231-8840-7765',    'Toothache',       'new',        NOW()-INTERVAL'78 days',NULL,NULL),
(1,'Noah Davis',      '+1 555 103 1004','noah.davis@example.com',     '2001-07-08',NULL,                        'Root canal',      'new',        NOW()-INTERVAL'75 days',NULL,NULL),
(1,'Ava Wilson',      '+1 555 104 1005','ava.wilson@example.com',     '1969-11-15','Aetna 6612-0093-4410',     'Whitening',       'new',        NOW()-INTERVAL'72 days',NULL,NULL),
(1,'Lucas Thompson',  '+1 555 105 1006','lucas.thompson@example.com', '1983-03-03','Delta Dental 4471-2280-1234','Filling',        'new',        NOW()-INTERVAL'70 days',NULL,NULL),
(1,'Mia Anderson',    '+1 555 106 1007','mia.anderson@example.com',   '1995-12-19',NULL,                        'Crown',           'new',        NOW()-INTERVAL'68 days',NULL,NULL),
(1,'Ethan Thomas',    '+1 555 107 1008','ethan.thomas@example.com',   '1979-06-27','Cigna DPPO 9910-3385-5521', 'Braces consult',  'new',        NOW()-INTERVAL'65 days',NULL,NULL),
(1,'Sophia Taylor',   '+1 555 108 1009','sophia.taylor@example.com',  '2004-02-14','MetLife 2231-8840-7765',    'Extraction',      'new',        NOW()-INTERVAL'62 days',NULL,NULL),
(1,'James Moore',     '+1 555 109 1010','james.moore@example.com',    '1990-10-05',NULL,                        'Gum bleeding',    'new',        NOW()-INTERVAL'60 days',NULL,NULL),
(1,'Isabella White',  '+1 555 110 1011','isabella.white@example.com', '1986-08-21','Aetna 6612-0093-4410',     'Implant consult', 'new',        NOW()-INTERVAL'57 days',NULL,NULL),
(1,'Benjamin Harris', '+1 555 111 1012','ben.harris@example.com',     '1972-05-11','Delta Dental 4471-2280-1234','Cleaning',       'follow-up',  NOW()-INTERVAL'55 days',NULL,NULL),
(1,'Charlotte Clark', '+1 555 112 1013','charlotte.clark@example.com','1998-09-09',NULL,                        'Checkup',         'follow-up',  NOW()-INTERVAL'52 days',NULL,NULL),
(1,'Henry Lewis',     '+1 555 113 1014','henry.lewis@example.com',    '1965-04-01','Cigna DPPO 9910-3385-5521', 'Root canal',      'new',        NOW()-INTERVAL'50 days',NULL,NULL),
(1,'Amelia Young',    '+1 555 114 1015','amelia.young@example.com',   '1993-07-17','MetLife 2231-8840-7765',    'Filling',         'new',        NOW()-INTERVAL'47 days',NULL,NULL),
(1,'Alexander King',  '+1 555 115 1016','alex.king@example.com',      '1981-12-02',NULL,                        'Toothache',       'new',        NOW()-INTERVAL'45 days',NULL,NULL),
(1,'Harper Wright',   '+1 555 116 1017','harper.wright@example.com',  '2000-03-28','Aetna 6612-0093-4410',     'Whitening',       'new',        NOW()-INTERVAL'42 days',NULL,NULL),
(1,'Daniel Scott',    '+1 555 117 1018','daniel.scott@example.com',   '1977-01-13','Delta Dental 4471-2280-1234','Cleaning',       'new',        NOW()-INTERVAL'40 days',NULL,NULL),
(1,'Evelyn Green',    '+1 555 118 1019','evelyn.green@example.com',   '1989-06-06',NULL,                        'Crown',           'new',        NOW()-INTERVAL'37 days',NULL,NULL),
(1,'Michael Baker',   '+1 555 119 1020','michael.baker@example.com',  '1970-10-24','Cigna DPPO 9910-3385-5521', 'Checkup',         'follow-up',  NOW()-INTERVAL'35 days',NULL,NULL),
-- RESCHEDULED past
(1,'Emma Johnson',    '+1 555 100 1001','emma.johnson@example.com',   '1988-04-12','Delta Dental 4471-2280-1234','Cleaning',       'rescheduled',NOW()-INTERVAL'30 days',NOW()-INTERVAL'33 days',NULL),
(1,'Liam Smith',      '+1 555 101 1002','liam.smith@example.com',     '1975-09-30','Cigna DPPO 9910-3385-5521', 'Checkup',         'rescheduled',NOW()-INTERVAL'28 days',NOW()-INTERVAL'31 days',NULL),
-- CANCELLED past
(1,'Abigail Hall',    '+1 555 120 1021','abigail.hall@example.com',   '1996-05-30',NULL,                        'Filling',         'new',        NOW()-INTERVAL'25 days',NULL,NOW()-INTERVAL'26 days'),
(1,'Sebastian Allen', '+1 555 121 1022','sebastian.allen@example.com','1984-11-08','Aetna 6612-0093-4410',     'Implant consult', 'new',        NOW()-INTERVAL'22 days',NULL,NOW()-INTERVAL'23 days'),
(1,'Emily Nelson',    '+1 555 122 1023','emily.nelson@example.com',   '1991-02-25','MetLife 2231-8840-7765',    'Braces consult',  'new',        NOW()-INTERVAL'20 days',NULL,NOW()-INTERVAL'21 days'),
-- more past completed
(1,'Jack Parker',     '+1 555 123 1024','jack.parker@example.com',    '1968-08-16','Delta Dental 4471-2280-1234','Extraction',     'new',        NOW()-INTERVAL'18 days',NULL,NULL),
(1,'Lucy Reed',       '+1 555 124 1025','lucy.reed@example.com',      '1987-03-14','Cigna DPPO 9910-3385-5521', 'Root canal',      'follow-up',  NOW()-INTERVAL'15 days',NULL,NULL),
(1,'William Brooks',  '+1 555 125 1026','william.brooks@example.com', '1976-06-18',NULL,                        'Cleaning',        'new',        NOW()-INTERVAL'14 days',NULL,NULL),
(1,'Ella Turner',     '+1 555 126 1027','ella.turner@example.com',    '1994-09-02','Aetna 6612-0093-4410',     'Gum bleeding',    'new',        NOW()-INTERVAL'12 days',NULL,NULL),
(1,'Samuel Edwards',  '+1 555 127 1028','samuel.edwards@example.com', '1982-01-26','MetLife 2231-8840-7765',    'Filling',         'new',        NOW()-INTERVAL'10 days',NULL,NULL),
(1,'Chloe Walker',    '+1 555 128 1029','chloe.walker@example.com',   '1999-04-07',NULL,                        'Checkup',         'new',        NOW()-INTERVAL'8 days', NULL,NULL),
(1,'George Morgan',   '+1 555 129 1030','george.morgan@example.com',  '1973-12-11','Delta Dental 4471-2280-1234','Whitening',      'new',        NOW()-INTERVAL'6 days', NULL,NULL),
(1,'Ayesha Khan',     '+1 555 130 1031','ayesha.khan@example.com',    '1991-05-09','Cigna DPPO 9910-3385-5521', 'Crown',           'new',        NOW()-INTERVAL'4 days', NULL,NULL),
(1,'Rohan Patel',     '+1 555 131 1032','rohan.patel@example.com',    '1985-07-22',NULL,                        'Braces consult',  'new',        NOW()-INTERVAL'3 days', NULL,NULL),
(1,'Priya Sharma',    '+1 555 132 1033','priya.sharma@example.com',   '1993-11-04','Aetna 6612-0093-4410',     'Cleaning',        'follow-up',  NOW()-INTERVAL'2 days', NULL,NULL),
(1,'Omar Ahmed',      '+1 555 133 1034','omar.ahmed@example.com',     '1978-02-16','MetLife 2231-8840-7765',    'Toothache',       'new',        NOW()-INTERVAL'1 day',  NULL,NULL),
-- UPCOMING
(1,'Zara Malik',      '+1 555 134 1035','zara.malik@example.com',     '2000-08-13',NULL,                        'Filling',         'new',        NOW()+INTERVAL'1 day',  NULL,NULL),
(1,'Arjun Mehta',     '+1 555 135 1036','arjun.mehta@example.com',    '1989-10-28','Delta Dental 4471-2280-1234','Root canal',     'new',        NOW()+INTERVAL'2 days', NULL,NULL),
(1,'Aoife Murphy',    '+1 555 136 1037','aoife.murphy@example.com',   '1992-06-03','Cigna DPPO 9910-3385-5521', 'Checkup',         'new',        NOW()+INTERVAL'3 days', NULL,NULL),
(1,'Cian OBrien',     '+1 555 137 1038','cian.obrien@example.com',    '1984-09-19',NULL,                        'Crown',           'rescheduled',NOW()+INTERVAL'4 days', NOW()+INTERVAL'1 day',NULL),
(1,'Mei Chen',        '+1 555 138 1039','mei.chen@example.com',       '1996-01-15','Aetna 6612-0093-4410',     'Whitening',       'new',        NOW()+INTERVAL'5 days', NULL,NULL),
(1,'Daniel Kim',      '+1 555 139 1040','daniel.kim@example.com',     '1980-04-24','MetLife 2231-8840-7765',    'Cleaning',        'new',        NOW()+INTERVAL'6 days', NULL,NULL),
(1,'Emma Johnson',    '+1 555 100 1001','emma.johnson@example.com',   '1988-04-12','Delta Dental 4471-2280-1234','Checkup',        'follow-up',  NOW()+INTERVAL'7 days', NULL,NULL),
(1,'Noah Davis',      '+1 555 103 1004','noah.davis@example.com',     '2001-07-08',NULL,                        'Implant consult', 'new',        NOW()+INTERVAL'8 days', NULL,NULL),
(1,'Sophia Taylor',   '+1 555 108 1009','sophia.taylor@example.com',  '2004-02-14','MetLife 2231-8840-7765',    'Braces consult',  'follow-up',  NOW()+INTERVAL'9 days', NULL,NULL),
(1,'Isabella White',  '+1 555 110 1011','isabella.white@example.com', '1986-08-21','Aetna 6612-0093-4410',     'Gum bleeding',    'new',        NOW()+INTERVAL'10 days',NULL,NULL),
(1,'Mia Anderson',    '+1 555 106 1007','mia.anderson@example.com',   '1995-12-19',NULL,                        'Extraction',      'new',        NOW()+INTERVAL'11 days',NULL,NULL),
-- CANCELLED upcoming
(1,'Henry Lewis',     '+1 555 113 1014','henry.lewis@example.com',    '1965-04-01','Cigna DPPO 9910-3385-5521', 'Cleaning',        'new',        NOW()+INTERVAL'5 days', NULL,NOW()-INTERVAL'1 day'),
(1,'Amelia Young',    '+1 555 114 1015','amelia.young@example.com',   '1993-07-17','MetLife 2231-8840-7765',    'Filling',         'new',        NOW()+INTERVAL'12 days',NULL,NOW()-INTERVAL'2 days'),
-- more upcoming
(1,'Alexander King',  '+1 555 115 1016','alex.king@example.com',      '1981-12-02',NULL,                        'Crown',           'new',        NOW()+INTERVAL'13 days',NULL,NULL),
(1,'Benjamin Harris', '+1 555 111 1012','ben.harris@example.com',     '1972-05-11','Delta Dental 4471-2280-1234','Root canal',     'follow-up',  NOW()+INTERVAL'14 days',NULL,NULL);
