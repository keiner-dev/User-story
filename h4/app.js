const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const STORAGE_KEY = 'gestorpro_productos';
let productos = [];

const idsSincronizados = new Set();
const estadoEdicion = new Map();

const inputNombre    = document.getElementById('inputNombre');
const inputPrecio    = document.getElementById('inputPrecio');
const inputDesc      = document.getElementById('inputDesc');
const btnAgregar     = document.getElementById('btnAgregar');
const btnLimpiarForm = document.getElementById('btnLimpiarForm');
const btnSincronizar = document.getElementById('btnSincronizar');
const btnLimpiarStorage = document.getElementById('btnLimpiarStorage');
const listaProductos = document.getElementById('listaProductos');
const notificacion   = document.getElementById('notificacion');
const filtroTexto    = document.getElementById('filtroTexto');
const contadorEl     = document.getElementById('contadorProductos');
const logContainer   = document.getElementById('logContainer');
const puntito        = document.getElementById('puntito');
const estadoApiEl    = document.getElementById('estadoApi');

const log = (mensaje, tipo = 'info') => {
  const ahora = new Date();
  const hora = ahora.toLocaleTimeString('es-CO', { hour12: false });

  const entrada = document.createElement('div');
  entrada.classList.add('log-entry', `log-${tipo}`);
  entrada.innerHTML = `<span class="log-time">${hora}</span><span>${mensaje}</span>`;

  logContainer.prepend(entrada);

  while (logContainer.children.length > 50) {
    logContainer.removeChild(logContainer.lastChild);
  }
  console.log(`[${tipo.toUpperCase()}] ${hora} — ${mensaje}`);
};

const mostrarNotificacion = (mensaje, tipo = 'success') => {
  notificacion.textContent = mensaje;
  notificacion.className = tipo;

  clearTimeout(notificacion._timer);
  notificacion._timer = setTimeout(() => {
    notificacion.className = '';
    notificacion.textContent = '';
  }, 3000);
};

const validarFormulario = () => {
  let valido = true;

  [inputNombre, inputPrecio, inputDesc].forEach(campo => campo.classList.remove('error'));

  const nombre = inputNombre.value.trim();
  const precio = parseFloat(inputPrecio.value);
  const desc   = inputDesc.value.trim();

  if (!nombre) {
    inputNombre.classList.add('error');
    valido = false;
  }

  if (isNaN(precio) || precio <= 0) {
    inputPrecio.classList.add('error');
    valido = false;
  }

  if (!desc) {
    inputDesc.classList.add('error');
    valido = false;
  }

  if (!valido) {
    mostrarNotificacion('Por favor completa todos los campos correctamente.', 'error');
    log('Intento de agregar producto con datos inválidos.', 'error');
  }

  return valido;
};

const guardarEnStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
};


const cargarDesdeStorage = () => {
  const datos = localStorage.getItem(STORAGE_KEY);
  return datos ? JSON.parse(datos) : [];
};


const renderizarLista = () => {
  const termino = filtroTexto.value.toLowerCase().trim();

  const productosFiltrados = termino
    ? productos.filter(p => p.nombre.toLowerCase().includes(termino))
    : productos;

  contadorEl.textContent = `${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''}`;

  listaProductos.innerHTML = '';

  if (productosFiltrados.length === 0) {
    listaProductos.innerHTML = `
      <li style="border:none; background:transparent; justify-content:center;">
        <div class="vacio">
          <div class="vacio-icon">📦</div>
          <div>No hay productos. ¡Agrega uno arriba!</div>
        </div>
      </li>`;
    return;
  }

  productosFiltrados.forEach(producto => {
    const li = crearElementoProducto(producto);
    listaProductos.appendChild(li);
  });
};

const crearElementoProducto = (producto) => {
  const li = document.createElement('li');

  const badgeSync = idsSincronizados.has(producto.id)
    ? `<span class="sincronizado">API</span>`
    : '';

  li.innerHTML = `
    <div class="producto-info">
      <div class="producto-nombre">${producto.nombre} ${badgeSync}</div>
      <div class="producto-meta">
        <span class="precio-badge">$${Number(producto.precio).toFixed(2)}</span>
        <span>${producto.descripcion}</span>
      </div>
    </div>
    <div class="producto-acciones">
      <button class="btn-edit"  data-id="${producto.id}">Editar</button>
      <button class="btn-danger" data-id="${producto.id}">Eliminar</button>
    </div>`;

  li.querySelector('.btn-danger').addEventListener('click', () => {
    eliminarProducto(producto.id);
  });

  // Evento para editar / PUT (Task 5)
  li.querySelector('.btn-edit').addEventListener('click', () => {
    iniciarEdicion(producto.id);
  });

  return li;
};

const agregarProducto = () => {
  if (!validarFormulario()) return;

  const nuevoProducto = {
    id:          Date.now(),           
    nombre:      inputNombre.value.trim(),
    precio:      parseFloat(inputPrecio.value),
    descripcion: inputDesc.value.trim(),
    fechaAlta:   new Date().toISOString(),
  };

  productos.push(nuevoProducto);
  guardarEnStorage();
  renderizarLista();

  mostrarNotificacion(`"${nuevoProducto.nombre}" agregado correctamente.`, 'success');
  log(`Producto agregado: ${nuevoProducto.nombre} — $${nuevoProducto.precio}`, 'success');

  limpiarFormulario();

  enviarProductoAPI(nuevoProducto);
};

const eliminarProducto = async (idProducto) => {
  const index = productos.findIndex(p => p.id === idProducto);
  if (index === -1) return;

  const nombre = productos[index].nombre;

  // removeChild equivalente lógico — eliminamos del array
  productos.splice(index, 1);
  guardarEnStorage();
  renderizarLista();

  mostrarNotificacion(`"${nombre}" eliminado.`, 'success');
  log(`Producto eliminado: ${nombre}`, 'info');

  if (idsSincronizados.has(idProducto)) {
    await eliminarDeAPI(idProducto);
    idsSincronizados.delete(idProducto);
  }
};

const iniciarEdicion = (idProducto) => {
  const producto = productos.find(p => p.id === idProducto);
  if (!producto) return;

  inputNombre.value = producto.nombre;
  inputPrecio.value = producto.precio;
  inputDesc.value   = producto.descripcion;

  estadoEdicion.set('idActual', idProducto);

  btnAgregar.textContent = '✓ Actualizar';
  btnAgregar.onclick = () => guardarEdicion(idProducto);

  inputNombre.focus();
  log(`Modo edición activo para: ${producto.nombre}`, 'info');
};

const guardarEdicion = async (idProducto) => {
  if (!validarFormulario()) return;

  const index = productos.findIndex(p => p.id === idProducto);
  if (index === -1) return;

  const datosActualizados = {
    ...productos[index],
    nombre:      inputNombre.value.trim(),
    precio:      parseFloat(inputPrecio.value),
    descripcion: inputDesc.value.trim(),
  };

  productos[index] = datosActualizados;
  guardarEnStorage();
  renderizarLista();

  mostrarNotificacion(`"${datosActualizados.nombre}" actualizado.`, 'success');
  log(`Producto actualizado: ${datosActualizados.nombre}`, 'success');

  if (idsSincronizados.has(idProducto)) {
    await actualizarEnAPI(datosActualizados);
  }

  cancelarEdicion();
};

const cancelarEdicion = () => {
  estadoEdicion.clear();
  btnAgregar.textContent = '+ Agregar';
  btnAgregar.onclick = agregarProducto;
  limpiarFormulario();
};


const limpiarFormulario = () => {
  inputNombre.value = '';
  inputPrecio.value = '';
  inputDesc.value   = '';
  [inputNombre, inputPrecio, inputDesc].forEach(c => c.classList.remove('error'));

  if (estadoEdicion.has('idActual')) cancelarEdicion();
};

const obtenerDesdeAPI = async () => {
  actualizarEstadoAPI('Conectando…', false);
  btnSincronizar.disabled = true;

  try {
    const respuesta = await fetch(`${API_URL}?_limit=8`);

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    const productosAPI = datos.map(post => ({
      id:          post.id * 100000,        // evitamos colisión con ids locales
      nombre:      post.title.slice(0, 40), // recortamos el título largo
      precio:      parseFloat((Math.random() * 900 + 50).toFixed(2)),
      descripcion: post.body.slice(0, 80),
      fechaAlta:   new Date().toISOString(),
      origen:      'api',
    }));

    let nuevos = 0;
    productosAPI.forEach(p => {
      const existe = productos.some(local => local.id === p.id);
      if (!existe) {
        productos.push(p);
        idsSincronizados.add(p.id);
        nuevos++;
      }
    });

    guardarEnStorage();
    renderizarLista();

    actualizarEstadoAPI(`Online — ${nuevos} productos importados`, true);
    mostrarNotificacion(`Se importaron ${nuevos} productos desde la API.`, 'success');
    log(`GET ${API_URL} — ${datos.length} registros recibidos, ${nuevos} importados.`, 'success');

  } catch (error) {
    actualizarEstadoAPI('Error de conexión', false);
    mostrarNotificacion('No se pudo conectar con la API.', 'error');
    log(`GET fallido: ${error.message}`, 'error');
  } finally {
    btnSincronizar.disabled = false;
  }
};

const enviarProductoAPI = async (producto) => {
  try {
    const respuesta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: producto.nombre,
        body:  producto.descripcion,
        userId: 1,
      }),
    });

    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const resultado = await respuesta.json();
    log(`POST exitoso — ID servidor: ${resultado.id} | Local: ${producto.id}`, 'success');
    idsSincronizados.add(producto.id);
    renderizarLista(); 

  } catch (error) {
    log(`POST fallido para "${producto.nombre}": ${error.message}`, 'error');
  }
};

const actualizarEnAPI = async (producto) => {
  try {
    // JSONPlaceholder acepta PUT en /posts/1 … /posts/100
    const idApi = (producto.id % 100) + 1;
    const respuesta = await fetch(`${API_URL}/${idApi}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:     idApi,
        title:  producto.nombre,
        body:   producto.descripcion,
        userId: 1,
      }),
    });

    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    const resultado = await respuesta.json();
    log(`PUT exitoso — "${resultado.title}" actualizado en servidor.`, 'success');

  } catch (error) {
    log(`PUT fallido: ${error.message}`, 'error');
  }
};


const eliminarDeAPI = async (idProducto) => {
  try {
    const idApi = (idProducto % 100) + 1;
    const respuesta = await fetch(`${API_URL}/${idApi}`, {
      method: 'DELETE',
    });

    // JSONPlaceholder retorna 200 con {} en DELETE exitoso
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);

    log(`DELETE exitoso — ID API: ${idApi}`, 'success');

  } catch (error) {
    log(`DELETE fallido: ${error.message}`, 'error');
  }
};


const actualizarEstadoAPI = (texto, online) => {
  estadoApiEl.textContent = texto;
  puntito.className = `status-dot ${online ? 'online' : 'offline'}`;
};


const limpiarTodoElStorage = () => {
  if (!confirm('¿Seguro? Esto borrará todos los productos del almacenamiento local.')) return;

  localStorage.removeItem(STORAGE_KEY);
  productos = [];
  idsSincronizados.clear();
  renderizarLista();

  mostrarNotificacion('LocalStorage limpiado correctamente.', 'success');
  log('LocalStorage limpiado por el usuario.', 'info');
};



// Agregar producto con el botón
btnAgregar.addEventListener('click', agregarProducto);
[inputNombre, inputPrecio, inputDesc].forEach(campo => {
  campo.addEventListener('keydown', e => {
    if (e.key === 'Enter') agregarProducto();
  });
});

btnLimpiarForm.addEventListener('click', limpiarFormulario);

btnSincronizar.addEventListener('click', obtenerDesdeAPI);

btnLimpiarStorage.addEventListener('click', limpiarTodoElStorage);

filtroTexto.addEventListener('input', renderizarLista);

const inicializar = () => {
  productos = cargarDesdeStorage();
  renderizarLista();

  const cantidad = productos.length;
  log(
    cantidad > 0
      ? `Sesión restaurada — ${cantidad} producto${cantidad !== 1 ? 's' : ''} cargados desde LocalStorage.`
      : 'Aplicación iniciada. No hay datos previos en LocalStorage.',
    'info'
  );
};

inicializar();
