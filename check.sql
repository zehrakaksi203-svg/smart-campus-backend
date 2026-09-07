SELECT u.email, f.id AS faculty_id FROM "Users" u LEFT JOIN "Faculties" f ON f."userId" = u.id WHERE u.email = 'faculty.test@example.com';
