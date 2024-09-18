function isNumeric(num) {
  if (typeof num !== 'number') {
    throw new TypeError(`Expected a 'number', got ${typeof num}`)
  }
  
  return !isNaN(parseFloat(num)) && isFinite(num)
}
