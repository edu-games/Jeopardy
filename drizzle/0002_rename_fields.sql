ALTER TABLE `questions` RENAME COLUMN `answer` TO `clue`;--> statement-breakpoint
ALTER TABLE `questions` RENAME COLUMN `question` TO `response`;--> statement-breakpoint
ALTER TABLE `board_question_slots` RENAME COLUMN `is_daily_double` TO `is_wild_card`;
