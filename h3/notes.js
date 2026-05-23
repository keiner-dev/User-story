const inputNota     = document.getElementById("inputNota");    
const btnAgregar    = document.getElementById("btnAgregar");    
const listaNotas    = document.getElementById("listaNotas");    
const mensajeError  = document.querySelector("#mensajeError");  
const contadorNotas = document.querySelector("#contadorNotas"); 
const estadoVacio   = document.querySelector("#estadoVacio");   


console.log("── Referencias del DOM ──");
console.log("inputNota:",     inputNota);
console.log("btnAgregar:",    btnAgregar);
console.log("listaNotas:",    listaNotas);
console.log("mensajeError:",  mensajeError);
console.log("contadorNotas:", contadorNotas);
console.log("estadoVacio:",   estadoVacio);


const LS_KEY = "notas";

let notas = [];

const datosGuardados = localStorage.getItem(LS_KEY);

if (datosGuardados) {
  notas = JSON.parse(datosGuardados);
  console.log(`── LocalStorage ── Se cargaron ${notas.length} nota(s) guardada(s).`);
  notas.forEach((texto) => renderizarNota(texto));
} else {
  console.log("── LocalStorage ── No hay notas previas guardadas.");
}

actualizarContador();


btnAgregar.addEventListener("click", () => {
  const texto = inputNota.value.trim();

  if (texto === "") {
    mostrarError(true);
    return;
  }

  mostrarError(false);

  notas.push(texto);
  guardarEnLocalStorage();
  renderizarNota(texto);

  inputNota.value = "";
  inputNota.focus();

  actualizarContador();
  console.log(`── Nota agregada: "${texto}" | Total: ${notas.length}`);
});

inputNota.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnAgregar.click();
});



function renderizarNota(texto) {
  const li = document.createElement("li");
  li.className = [
    "flex", "items-center", "justify-between", "gap-3",
    "bg-bg", "border", "border-border", "rounded-[10px]",
    "px-3.5", "py-3", "font-mono", "text-sm", "animate-slideIn"
  ].join(" ");

  const spanTexto = document.createElement("span");
  spanTexto.className   = "texto-nota flex-1 break-words text-txt";
  spanTexto.textContent = texto; // 

  const btnEliminar = document.createElement("button");
  btnEliminar.className = [
    "btn-eliminar",
    "bg-transparent", "border", "border-border", "rounded-md",
    "text-muted", "font-mono", "text-xs",
    "px-2.5", "py-1", "cursor-pointer", "shrink-0",
    "transition-all", "duration-150"
  ].join(" ");
  btnEliminar.textContent = "Eliminar";

  btnEliminar.addEventListener("click", () => {
    listaNotas.removeChild(li); 

    const indice = notas.indexOf(texto);
    if (indice !== -1) notas.splice(indice, 1);

    guardarEnLocalStorage();
    actualizarContador();

    console.log(`── Nota eliminada: "${texto}" | Restantes: ${notas.length}`);
  });

  li.appendChild(spanTexto);
  li.appendChild(btnEliminar);
  listaNotas.appendChild(li); 

  estadoVacio.classList.remove("visible");
}

function guardarEnLocalStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(notas));
  console.log(`── LocalStorage ── Guardado: ${notas.length} nota(s).`, notas);
}

function actualizarContador() {
  const total = notas.length;
  contadorNotas.textContent = `${total} ${total === 1 ? "nota" : "notas"}`;

  if (total === 0) {
    estadoVacio.classList.add("visible");
  } else {
    estadoVacio.classList.remove("visible");
  }
}

function mostrarError(visible) {
  if (visible) {
    mensajeError.classList.add("visible");
  } else {
    mensajeError.classList.remove("visible");
  }
}