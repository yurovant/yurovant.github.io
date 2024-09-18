function generateUniqueId() {
  const timeStamp = Date.now().toString(36) // Convert current timestamp to base36 string
  const randomStr = Math.random().toString(36).substring(2, 10) // Generate a random string

  return `${timeStamp}${randomStr}` // Concatenate timestamp and random string
}
