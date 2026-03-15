-- D1 SQL Script to update user password_hash
-- Replace 'YOUR_HASHED_PASSWORD_HERE' with the SHA-256 hash of your password
-- Replace 'user@example.com' with the user's email or use user ID

-- Update password by email
UPDATE users 
SET password_hash = 'YOUR_HASHED_PASSWORD_HERE', 
    updated_at = datetime('now')
WHERE email = 'user@example.com';

-- OR update password by user ID
-- UPDATE users 
-- SET password_hash = 'YOUR_HASHED_PASSWORD_HERE', 
--     updated_at = datetime('now')
-- WHERE id = 1;

