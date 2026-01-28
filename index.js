// index.js
const bcrypt = require("bcrypt");

// Password to hash
const password = "Admin@123";
const saltRounds = 10; // complexity

// Async function to hash and verify password
async function run() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed Password:", hashedPassword);

    // Verify the password
    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log("Password Match:", isMatch);

    // Example: wrong password check
    const isWrong = await bcrypt.compare("WrongPassword", hashedPassword);
    console.log("Wrong Password Match:", isWrong);
  } catch (err) {
    console.error(err);
  }
}

run();
