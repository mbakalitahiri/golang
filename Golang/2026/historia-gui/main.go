package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/theme"
	"fyne.io/fyne/v2/widget"

	"go.etcd.io/bbolt"
)

type Historia struct {
	ID              string    `json:"id"`
	Descripcion     string    `json:"descripcion"`
	GMUD            string    `json:"gmud"`
	TipoGMUD        string    `json:"tipo_gmud"`
	TestesMutantes  string    `json:"testes_mutantes"`
	TestesIUQuali   string    `json:"testes_iu_quali"`
	Figma           string    `json:"figma"`
	Notas           string    `json:"notas"`
	Accesibilidad   string    `json:"accessibility"`
	Activo          bool      `json:"activo"`
	FechaCreacion   time.Time `json:"fecha_creacion"`
	FechaGMUD       time.Time `json:"fecha_gemud"`
	FechaDocker     time.Time `json:"fecha_docker"`
	FechaHomolog    time.Time `json:"fecha_homolog"`
	FechaPiloto     time.Time `json:"fecha_piloto"`
	FechaProduccion time.Time `json:"fecha_produccion"`
}

var db *bbolt.DB
var bucketName = []byte("HistoriasBucket")

var todasLasHistorias []Historia
var historiasFiltradas []Historia
var paginaActual = 0

const itemsPorPagina = 2

var textoBusqueda = ""
var filtroSoloActivos = false
var historiaSeleccionadaID = ""

func initDB() {
	var err error

	db, err = bbolt.Open(
		"historias.db",
		0600,
		&bbolt.Options{
			Timeout: 1 * time.Second,
		},
	)

	if err != nil {
		log.Fatal("Error al abrir BoltDB:", err)
	}

	err = db.Update(func(tx *bbolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists(bucketName)
		return err
	})

	if err != nil {
		log.Fatal("Error al crear el bucket en BoltDB:", err)
	}
}

func cargarHistoriasDesdeDB() {
	todasLasHistorias = []Historia{}
	db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(bucketName)
		if b == nil {
			return nil
		}
		b.ForEach(func(k, v []byte) error {
			var h Historia
			if err := json.Unmarshal(v, &h); err == nil {
				todasLasHistorias = append(todasLasHistorias, h)
			}
			return nil
		})
		return nil
	})
}

func guardarHistoriaEnDB(h Historia) error {
	return db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket(bucketName)
		data, err := json.Marshal(h)
		if err != nil {
			return err
		}
		return b.Put([]byte(h.ID), data)
	})
}

func eliminarHistoriaDeDB(id string) error {
	return db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket(bucketName)
		return b.Delete([]byte(id))
	})
}

func parsearFecha(texto string) time.Time {
	t, err := time.Parse("2006-01-02", strings.TrimSpace(texto))
	if err != nil {
		return time.Now()
	}
	return t
}

func formatearFecha(t time.Time) string {
	if t.IsZero() {
		return time.Now().Format("2006-01-02")
	}
	return t.Format("2006-01-02")
}

func crearCampoFechaConCalendario(ventana fyne.Window, hoyStr string) (*widget.Entry, *fyne.Container) {
	entrada := widget.NewEntry()
	entrada.SetText(hoyStr)
	entrada.SetPlaceHolder("AAAA-MM-DD")

	btnCalendario := widget.NewButton("Hoy", func() {
		entrada.SetText(time.Now().Format("2006-01-02"))
	})

	contenedor := container.NewBorder(
		nil,
		nil,
		nil,
		btnCalendario,
		entrada,
	)

	return entrada, contenedor
}

func actualizarFiltrosYPagina(listaUI *widget.List, infoPagina *widget.Label) {
	historiasFiltradas = []Historia{}
	for _, h := range todasLasHistorias {
		coincideTexto := textoBusqueda == "" ||
			strings.Contains(strings.ToLower(h.ID), strings.ToLower(textoBusqueda)) ||
			strings.Contains(strings.ToLower(h.Descripcion), strings.ToLower(textoBusqueda))

		coincideFiltroActivo := !filtroSoloActivos || h.Activo

		if coincideTexto && coincideFiltroActivo {
			historiasFiltradas = append(historiasFiltradas, h)
		}
	}

	totalItems := len(historiasFiltradas)
	maxPaginas := (totalItems + itemsPorPagina - 1) / itemsPorPagina
	if paginaActual >= maxPaginas && maxPaginas > 0 {
		paginaActual = maxPaginas - 1
	}
	if paginaActual < 0 {
		paginaActual = 0
	}

	desde := paginaActual * itemsPorPagina
	hasta := desde + itemsPorPagina
	if hasta > totalItems {
		hasta = totalItems
	}

	if totalItems == 0 {
		infoPagina.SetText("0-0 de 0")
	} else {
		infoPagina.SetText(fmt.Sprintf("%d-%d de %d (Pag. %d)", desde+1, hasta, totalItems, paginaActual+1))
	}
	listaUI.Refresh()
}

func obtenerElementosPaginaActual() []Historia {
	desde := paginaActual * itemsPorPagina
	hasta := desde + itemsPorPagina
	if desde >= len(historiasFiltradas) {
		return []Historia{}
	}
	if hasta > len(historiasFiltradas) {
		hasta = len(historiasFiltradas)
	}
	return historiasFiltradas[desde:hasta]
}

func main() {
	initDB()
	defer db.Close()
	cargarHistoriasDesdeDB()

	miApp := app.New()
	miApp.Settings().SetTheme(theme.LightTheme())

	ventana := miApp.NewWindow("Gestion de Historias - BoltDB")
	ventana.Resize(fyne.NewSize(1200, 800))

	historiasFiltradas = todasLasHistorias

	inID := widget.NewEntry()
	inID.SetPlaceHolder("Ej: HST-102")
	inDesc := widget.NewMultiLineEntry()
	inDesc.SetPlaceHolder("Descripcion detallada...")
	inGMUD := widget.NewEntry()
	inGMUD.SetPlaceHolder("Codigo o texto de la GMUD")
	inTipoGMUD := widget.NewSelect([]string{"Motor", "Estera"}, func(string) {})
	inTestesMutantes := widget.NewEntry()
	inTestesMutantes.SetPlaceHolder("Testes mutantes (Opcional)")
	inTestesIUQuali := widget.NewEntry()
	inTestesIUQuali.SetPlaceHolder("Resultado de pruebas cualitativas de IU")
	inFigma := widget.NewEntry()
	inFigma.SetPlaceHolder("URL o referencia del diseno en Figma")
	inNotas := widget.NewEntry()
	inNotas.SetPlaceHolder("Notas aclaratorias...")
	inAccesibilidad := widget.NewEntry()
	inAccesibilidad.SetPlaceHolder("Ej: Cumple WCAG AA")
	inActivo := widget.NewCheck("Historia Activa / Visible", func(bool) {})

	hoyStr := time.Now().Format("2006-01-02")
	inFechaCreacion, layoutFechaCreacion := crearCampoFechaConCalendario(ventana, hoyStr)
	inFechaGMUD, layoutFechaGMUD := crearCampoFechaConCalendario(ventana, hoyStr)
	inFechaDocker, layoutFechaDocker := crearCampoFechaConCalendario(ventana, hoyStr)
	inFechaHomolog, layoutFechaHomolog := crearCampoFechaConCalendario(ventana, hoyStr)
	inFechaPiloto, layoutFechaPiloto := crearCampoFechaConCalendario(ventana, hoyStr)
	inFechaProd, layoutFechaProd := crearCampoFechaConCalendario(ventana, hoyStr)

	inputsTexto := map[string]*widget.Entry{
		"desc": inDesc, "gmud": inGMUD, "mutantes": inTestesMutantes,
		"iu": inTestesIUQuali, "figma": inFigma, "notas": inNotas, "access": inAccesibilidad,
	}

	inputsFechas := map[string]*widget.Entry{
		"creacion": inFechaCreacion, "gmud": inFechaGMUD, "docker": inFechaDocker,
		"homolog": inFechaHomolog, "piloto": inFechaPiloto, "prod": inFechaProd,
	}

	tituloFormulario := widget.NewLabel("Nueva Historia")
	tituloFormulario.TextStyle = fyne.TextStyle{Bold: true}

	var listaUI *widget.List
	infoPagina := widget.NewLabel("")

	listaUI = widget.NewList(
		func() int { return len(obtenerElementosPaginaActual()) },
		func() fyne.CanvasObject {
			return container.NewBorder(nil, nil, widget.NewLabel("ID_HISTORIA"), nil, widget.NewLabel("DESCRIPCION"))
		},
		func(id widget.ListItemID, obj fyne.CanvasObject) {
			elementosPage := obtenerElementosPaginaActual()
			if id >= len(elementosPage) {
				return
			}
			h := elementosPage[id]

			borderBox := obj.(*fyne.Container)

			idTexto := h.ID
			if !h.Activo {
				idTexto += " (Inactivo)"
			}
			borderBox.Objects[1].(*widget.Label).SetText(idTexto)
			borderBox.Objects[1].(*widget.Label).TextStyle = fyne.TextStyle{Bold: true}
			borderBox.Objects[0].(*widget.Label).SetText(h.Descripcion)
		},
	)

	inputBusqueda := widget.NewEntry()
	inputBusqueda.SetPlaceHolder("🔍 Buscar por ID o Descripcion...")
	inputBusqueda.OnChanged = func(texto string) {
		textoBusqueda = texto
		paginaActual = 0
		actualizarFiltrosYPagina(listaUI, infoPagina)
	}

	selectorFiltro := widget.NewSelect([]string{"Mostrar Todos", "Solo Activos"}, func(seleccionado string) {
		filtroSoloActivos = (seleccionado == "Solo Activos")
		paginaActual = 0
		actualizarFiltrosYPagina(listaUI, infoPagina)
	})
	selectorFiltro.SetSelected("Mostrar Todos")

	btnAnt := widget.NewButtonWithIcon("", theme.NavigateBackIcon(), func() {
		if paginaActual > 0 {
			paginaActual--
			actualizarFiltrosYPagina(listaUI, infoPagina)
		}
	})
	btnSig := widget.NewButtonWithIcon("", theme.NavigateNextIcon(), func() {
		maxPaginas := (len(historiasFiltradas) + itemsPorPagina - 1) / itemsPorPagina
		if paginaActual < maxPaginas-1 {
			paginaActual++
			actualizarFiltrosYPagina(listaUI, infoPagina)
		}
	})

	limpiarFormulario := func() {
		historiaSeleccionadaID = ""
		tituloFormulario.SetText("Nueva Historia")
		inID.SetText("")
		inID.Enable()
		inTipoGMUD.ClearSelected()
		inActivo.SetChecked(true)

		for _, input := range inputsTexto {
			input.SetText("")
		}
		for _, inputFecha := range inputsFechas {
			inputFecha.SetText(hoyStr)
		}
		listaUI.UnselectAll()
	}

	listaUI.OnSelected = func(id widget.ListItemID) {
		elementosPage := obtenerElementosPaginaActual()
		if id >= len(elementosPage) {
			return
		}
		h := elementosPage[id]

		historiaSeleccionadaID = h.ID
		tituloFormulario.SetText("Editar Historia: " + h.ID)

		inID.SetText(h.ID)
		inID.Disable()
		inTipoGMUD.SetSelected(h.TipoGMUD)
		inActivo.SetChecked(h.Activo)

		inputsTexto["desc"].SetText(h.Descripcion)
		inputsTexto["gmud"].SetText(h.GMUD)
		inputsTexto["mutantes"].SetText(h.TestesMutantes)
		inputsTexto["iu"].SetText(h.TestesIUQuali)
		inputsTexto["figma"].SetText(h.Figma)
		inputsTexto["notas"].SetText(h.Notas)
		inputsTexto["access"].SetText(h.Accesibilidad)

		inputsFechas["creacion"].SetText(formatearFecha(h.FechaCreacion))
		inputsFechas["gmud"].SetText(formatearFecha(h.FechaGMUD))
		inputsFechas["docker"].SetText(formatearFecha(h.FechaDocker))
		inputsFechas["homolog"].SetText(formatearFecha(h.FechaHomolog))
		inputsFechas["piloto"].SetText(formatearFecha(h.FechaPiloto))
		inputsFechas["prod"].SetText(formatearFecha(h.FechaProduccion))
	}

	btnAnadirNueva := widget.NewButtonWithIcon("Anadir Nueva Historia", theme.ContentAddIcon(), func() {
		limpiarFormulario()
	})
	btnAnadirNueva.Importance = widget.MediumImportance

	btnGuardar := widget.NewButton("Guardar", func() {
		if inID.Text == "" || inDesc.Text == "" {
			return
		}

		nueva := Historia{
			ID:              inID.Text,
			TipoGMUD:        inTipoGMUD.Selected,
			Activo:          inActivo.Checked,
			Descripcion:     inputsTexto["desc"].Text,
			GMUD:            inputsTexto["gmud"].Text,
			TestesMutantes:  inputsTexto["mutantes"].Text,
			TestesIUQuali:   inputsTexto["iu"].Text,
			Figma:           inputsTexto["figma"].Text,
			Notas:           inputsTexto["notas"].Text,
			Accesibilidad:   inputsTexto["access"].Text,
			FechaCreacion:   parsearFecha(inputsFechas["creacion"].Text),
			FechaGMUD:       parsearFecha(inputsFechas["gmud"].Text), // Corregido el ':' faltante aquí
			FechaDocker:     parsearFecha(inputsFechas["docker"].Text),
			FechaHomolog:    parsearFecha(inputsFechas["homolog"].Text),
			FechaPiloto:     parsearFecha(inputsFechas["piloto"].Text),
			FechaProduccion: parsearFecha(inputsFechas["prod"].Text),
		}

		err := guardarHistoriaEnDB(nueva)
		if err != nil {
			return
		}

		cargarHistoriasDesdeDB()
		limpiarFormulario()
		actualizarFiltrosYPagina(listaUI, infoPagina)
	})
	btnGuardar.Importance = widget.HighImportance

	btnBorrar := widget.NewButton("Eliminar", func() {
		if historiaSeleccionadaID == "" {
			return
		}

		dialogoConfirmar := dialog.NewConfirm(
			"Confirmar Eliminacion",
			fmt.Sprintf("¿Estas seguro de que deseas eliminar la historia %s?\nEsta accion no se puede deshacer.", historiaSeleccionadaID),
			func(confirmado bool) {
				if confirmado {
					err := eliminarHistoriaDeDB(historiaSeleccionadaID)
					if err == nil {
						cargarHistoriasDesdeDB()
						limpiarFormulario()
						actualizarFiltrosYPagina(listaUI, infoPagina)
					}
				}
			},
			ventana,
		)
		dialogoConfirmar.SetDismissText("No, Cancelar")
		dialogoConfirmar.SetConfirmText("Si, Eliminar")
		dialogoConfirmar.Show()
	})
	btnBorrar.Importance = widget.DangerImportance

	btnHolaMundo := widget.NewButton("Hola Mundo", func() {
		dialog.ShowInformation("Mensaje del Sistema", "Hola Mundo", ventana)
	})
	btnHolaMundo.Importance = widget.MediumImportance

	paginadorLayout := container.NewHBox(
		widget.NewLabel("Filas por pagina: 2"),
		widget.NewLabel("   "),
		infoPagina,
		btnAnt,
		btnSig,
	)

	encabezadoTabla := container.NewBorder(nil, nil, widget.NewLabel("ID"), nil, widget.NewLabel("Descripcion de la Historia"))

	panelIzquierdo := container.NewBorder(
		container.NewVBox(
			btnAnadirNueva,
			widget.NewSeparator(),
			container.NewGridWithColumns(2, inputBusqueda, selectorFiltro),
			encabezadoTabla,
			widget.NewSeparator(),
		),
		container.NewVBox(widget.NewSeparator(), paginadorLayout),
		nil, nil,
		listaUI,
	)

	gridFechas := container.NewGridWithColumns(2,
		container.NewVBox(widget.NewLabel("Fecha Creacion:"), layoutFechaCreacion),
		container.NewVBox(widget.NewLabel("Fecha GMUD:"), layoutFechaGMUD),
		container.NewVBox(widget.NewLabel("Fecha Docker:"), layoutFechaDocker),
		container.NewVBox(widget.NewLabel("Fecha Homologacion:"), layoutFechaHomolog),
		container.NewVBox(widget.NewLabel("Fecha Piloto:"), layoutFechaPiloto),
		container.NewVBox(widget.NewLabel("Fecha Produccion:"), layoutFechaProd),
	)

	panelDerecho := container.NewVBox(
		tituloFormulario,
		widget.NewSeparator(),
		inActivo,
		widget.NewLabel("ID Alfanumerico:"), inID,
		widget.NewLabel("Descripcion:"), inDesc,
		widget.NewLabel("Codigo GMUD:"), inGMUD,
		widget.NewLabel("Tipo GMUD:"), inTipoGMUD,
		widget.NewLabel("Testes Mutantes (Opcional):"), inTestesMutantes,
		widget.NewLabel("Testes IUQuali:"), inTestesIUQuali,
		widget.NewLabel("Figma (Link / Referencia):"), inFigma,
		widget.NewLabel("Accesibilidad:"), inAccesibilidad,
		widget.NewLabel("Notas:"), inNotas,
		widget.NewSeparator(),
		widget.NewLabel("CRONOGRAMA"),
		gridFechas,
		widget.NewSeparator(),
		container.NewHBox(btnGuardar, btnBorrar, btnHolaMundo),
	)

	contenidoSplit := container.NewHSplit(
		container.NewPadded(panelIzquierdo),
		container.NewScroll(container.NewPadded(panelDerecho)),
	)
	contenidoSplit.Offset = 0.45

	actualizarFiltrosYPagina(listaUI, infoPagina)

	ventana.SetContent(contenidoSplit)
	ventana.ShowAndRun()
}
