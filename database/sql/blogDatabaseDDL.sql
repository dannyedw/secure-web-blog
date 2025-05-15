-- Uncomment below to define table (make sure to set permissions in grant wizzard)
-- CREATE TABLE users (
-- 	id SERIAL PRIMARY KEY,
-- 	username VARCHAR(50) NOT NULL UNIQUE,
-- 	password VARCHAR(256) NOT NULL,
-- 	first_name VARCHAR(50) NOT NULL,
-- 	last_name VARCHAR(50) NOT NULL,
-- 	email VARCHAR(60) NOT NULL UNIQUE,
--  email_verified BOOLIAN NOT NULL DEFAULT 'false'
-- );

-- Uncomment below to define table (make sure to set permissions in grant wizzard)
-- CREATE TABLE posts(
-- 	id SERIAL PRIMARY KEY,
-- 	user_id INTEGER NOT NULL,
-- 	title VARCHAR(50) NOT NULL,
-- 	content VARCHAR(256) NOT NULL,
-- 	creation_date TIMESTAMP NOT NULL,
--  last_edit_date TIMESTAMP,
--  	visibility VARCHAR(7) NOT NULL DEFAULT 'public' CHECK (visibility = 'public' OR visibility = 'private'),
-- 	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
-- );

-- Uncomment below to define table (make sure to set permissions in grant wizzard)
-- CREATE TABLE emailcodes(
--     email VARCHAR(60) PRIMARY KEY,
--     code VARCHAR(6) NOT NULL,
--     FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE --don't cascade update, as the entry will want to be
--     deleted by the server after being updated (unless this can be done automatically in sql but i couldnt figure it out)
-- );

-- Uncomment below to define table (make sure to set permissions in grant wizzard)
-- CREATE TABLE compromisedpasswords(
--     passwords VARCHAR(256)
-- );

-- Deleting database instead of dropping them so permisions dont need to be redone everytime
TRUNCATE users, posts, emailcodes RESTART IDENTITY;

------------------------------------ USERS
-- Password: man14
INSERT INTO users (username, password, first_name, last_name, email, email_verified) VALUES('dannyG','$argon2i$v=19$m=65536,t=3,p=4$DRZmz8BPmhIcD4tKl/AIFw$McyoIGTXPrWmQ+ELUV82M/cF44EgTXa2qDdEsVsKrRM','Dan','Garaway','dan@test.com', 'true');

-- Password: johnD
INSERT INTO users (username, password, first_name, last_name, email, email_verified) VALUES('johnD','$argon2i$v=19$m=65536,t=3,p=4$m6SIY4Flka46XIstH3X5Rw$d5MmaMSuSo/trlxf9N15iY+y5lFCdQ1LDFkCf8Nk/6U','John','Doe','john@test.com', 'true');

-- Password: jimD
INSERT INTO users (username, password, first_name, last_name, email, email_verified) VALUES('jimD','$argon2i$v=19$m=65536,t=3,p=4$PAQa3s1fHpsNCmDGLYjNIA$Kciq7tOEvBo0NgxE/qFvfwKegRDtOHINyKS5HFc9qyQ','Jim','Doe','jim@test.com', 'true');


------------------------------------ POSTS

INSERT INTO posts (user_id, title, content, creation_date, visibility) VALUES ('1', 'Apple Pie', 'Just made an apple pie, very yummy', '2024-02-16 20:36:21', 'public');
INSERT INTO posts (user_id, title, content, creation_date, visibility) VALUES ('1', 'Secret Cookie recipie', 'The ingredients are: *insert very secret cookie recipie*', '2024-03-15 13:01:21', 'private');

INSERT INTO posts (user_id, title, content, creation_date, visibility) VALUES ('2', 'Biscuits', 'Just found the perfect recipie for some biscuts', '2024-04-01 16:38:41', 'public');

-- Getting users with posts
-- select users.id as user_id, users.username, posts.id as post_id, posts.title as post_title, posts.visibility as post_visibility FROM users, posts WHERE users.id = posts.user_id;

-- Getting users without posts
-- select id as user_id, username, 'none' as post_id, 'none' as post_title, 'none' as post_visiblity from users where id not in (select user_id from posts)

SELECT users.id AS user_id, users.username, posts.id AS post_id, posts.title AS post_title, posts.visibility AS post_visibility
FROM users
FULL JOIN posts ON users.id = posts.user_id;