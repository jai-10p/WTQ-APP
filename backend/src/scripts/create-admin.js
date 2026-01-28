/**
 * Create Admin User Script
 * Usage: node src/scripts/create-admin.js <username> <email> <password>
 */

const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../models');

const createAdmin = async () => {
    try {
        const args = process.argv.slice(2);
        const username = args[0] || 'admin';
        const email = args[1] || 'admin@example.com';
        const password = args[2] || 'admin123';

        console.log(`Creating admin user: ${username} (${email})`);

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.error('User with this email already exists.');
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password_hash: hashedPassword,
            role: 'admin',
            is_active: true
        });

        console.log('Admin user created successfully!');
        console.log('ID:', user.id);
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Password:', password);

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await sequelize.close();
    }
};

createAdmin();
