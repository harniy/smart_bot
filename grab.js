const block = document.querySelector('.items-leading').children
let arr = [...block]

let res = []

arr.forEach(elem => {
    let item = [...elem.children]
    let result = {}
    item.forEach((al, i) => {
        let text = al.innerText
        i === 0 ? result.title = text.slice(0, text.length - 2) : result.detail = text
    })

    res.push(result)
})


console.log(res)

