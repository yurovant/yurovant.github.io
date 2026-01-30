var myJSON = { 'name': 'L&#39;Oreal Paris' }
var text = document.createElement('textarea')

text.innerHTML = myJSON.name
// NOTE: text.textContent will not normalize the string

console.log(text.value)
// L'Oreal Paris
