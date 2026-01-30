function generateUniqueId() {
  // Convert current timestamp to base36 string
  const timeStamp = Date.now().toString(36);
  // Generate a random string
  const randomStr = Math.random().toString(36).substring(2, 10);
  // Concatenate timestamp and random string
  return `${timeStamp}${randomStr}`;
}
