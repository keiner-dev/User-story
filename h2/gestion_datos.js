const productos = {
    producto1: {
        id: 1,
        nombre: "Teclado",
        precio: 250000
    },
    producto2: {
        id: 2,
        nombre: "Mouse",
        precio: 89000
    },
    producto3: {
        id: 3,
        nombre: "Monitor",
        precio: 780000
    }
}

const set = new Set([1,2,3,4,5,6,7,7,1])
console.log(set)

set.add(9);
console.log(set);

console.log(set.has(8))

set.delete(2)
console.log(set);

for (let valor of set){
    console.log(valor);
}

const map = new Map();
map.set("Perifericos", "Teclado");
map.set("Perifericos", "Mouse");
map.set("Pantallas", "Monitor");

console.log(map)

for (const clave in productos){
    console.log(productos[clave]);
}

console.log(Object.keys(productos))

console.log(Object.values(productos))

Object.entries(productos).forEach(([clave, valor]) => {
    console.log(clave, valor);
})

for (const valor of set){
    console.log(valor);
}

map.forEach((valor, clave) => {
    console.log(clave, valor);
})

const validarProducto = (producto) => {
    if (typeof producto.id !== "number") {
        console.log("id invalido")
        return false
    }
    if (typeof producto.nombre !== "string" || producto.nombre.trim() === "") {
        console.log("nombre invalido")
        return false
    }
    if (typeof producto.precio !== "number" || producto.precio <= 0) {
        console.log("precio invalido")
        return false
    }
    return true
}

console.log(productos)

for (const clave in productos){
    console.log(validarProducto(productos[clave]))
}

const productoInvalido = { id: "abc", nombre: "", precio: -5 }
console.log(validarProducto(productoInvalido))

const nombresUnicos = new Set(Object.values(productos).map(p => p.nombre))
console.log(nombresUnicos)

map.forEach((valor, clave) => {
    console.log(clave, valor)
})