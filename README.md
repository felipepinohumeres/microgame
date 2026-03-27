# Base Plataforma 2D con Phaser (CDN)

Proyecto base sin build tools, usando Phaser 3 cargado por CDN.
Render principal configurado en formato vertical (`9:16`) para mobile.

## Estructura

- `index.html`
- `level-editor.html`
- `player-editor.html`
- `src/main.js`
- `src/level-editor.js`
- `src/player-editor.js`
- `assets/`

## Ejecutar

1. Opcion rapida: abrir `index.html` en el navegador.
2. Opcion recomendada: levantar un servidor local en esta carpeta.

Ejemplo con VS Code Live Server o cualquier servidor estatico.

## Controles

- Flecha izquierda: mover a la izquierda
- Flecha derecha: mover a la derecha
- Flecha arriba o espacio: saltar
- Tecla `X`: ataque cuerpo a cuerpo
- En mobile: botones tactiles en pantalla (`izquierda`, `derecha`, `salto`, `ataque`)

## Editor de niveles

- Abrir `level-editor.html`.
- Gestionar niveles desde la barra superior: `Nuevo`, `Duplicar`, `Renombrar`, `Eliminar`, `Activar`.
- Definir dimensiones del nivel con `Ancho`, `Alto` y `Aplicar Tamano`.
- Pintar/borrar tiles y ubicar spawns (jugador + tipos de enemigos).
- `Enemy`, `Charger` y `Turret` ahora tambien se ubican con coordenadas `x,y` (altura libre).
- Herramientas: `Spawn Jugador`, `Spawn Enemy`, `Spawn Flying`, `Spawn Charger`, `Spawn Turret`, `Spawn Bomber`, `Borrar Spawn`.
- `Guardar Local` guarda el nivel seleccionado en el catalogo local.
- Tambien podes cargar un archivo de `levels/` escribiendo solo el nombre base (`nivel-2`) con `Cargar Archivo`.
- `Activar` define que nivel usa el juego.
- `index.html` carga automaticamente el nivel activo guardado en `localStorage`.

## Editor del jugador

- Abrir `player-editor.html`.
- Ajustar movimiento, salto y ataque del jugador.
- Guardar para persistir en `localStorage` (`microgame_player_params_v1`).
- Recargar el juego para aplicar los cambios.

## Implementado

- Sprites por archivo (SVG): jugador, enemigo, tile y fondos
- Animaciones del jugador por spritesheet (`idle`, `run`, `jump`)
- Camara con seguimiento del jugador en mundo horizontal grande
- Fondo parallax (cielo y montanas)
- Nivel armado por tilemap (matriz de tiles)
- Colisiones y enemigos con IA: patrulla/persecucion/salto/disparo, volador con ataque vertical, `charger`, `turret` y `bomber`
- Estrellas coleccionables y puntaje
