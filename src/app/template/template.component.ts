import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AfterViewInit, Component, OnInit } from '@angular/core';
//import { AutenticacionServicio } from '../core/servicios/autenticacion.service';
declare var $: any;
@Component({
  selector: 'app-template',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.css']
})
export class TemplateComponent implements OnInit, AfterViewInit {

  user: any;

  constructor( public router: Router) { }

cambiarNavbar(){
  const element: any = document.getElementById('navigation');
  element.classList.toggle('sidebar-toggle');
}

  ngAfterViewInit(): void {
    /*document.addEventListener('DOMContentLoaded', () => {
      let sidebar: any = document.getElementById('sidebar');
      sidebar.addEventListener('click', () => {
        const element: any = document.getElementById('navigation');
        element.classList.toggle('sidebar-toggle');
        console.log("test");
      });
    });*/
    $('.list-item').each((els: any, el: any) => {
      el = $(el);
      //let el = $(this);
      let linkHasClass = (className: any) => {
        return el.parent().find('a').hasClass(className);
      }
      if (linkHasClass('link-arrow')) {
        el.find('a').addClass('up');
        if (linkHasClass('link-current')) {
          let current = $('.link-current');
          current.addClass('active down');
          current.next('ul').show();
        }
      }
    });
    $('.link-arrow').on('click', (els: any, el: any) => {
      //el =$(el);
      //console.log(els.target);
      el = $(els.target);
      // let el = $(this);
      el.addClass('transition')
        .toggleClass('active rotate');

      !(el.hasClass('link-current'))
        ? el.addClass('link-current')
        : el.removeClass('link-current');

      el.next('.list-hidden').slideToggle('fast');
      if (el.parent().find('a').hasClass('down')) {
        el.toggleClass('rotate-revert')
      }
    });
  }

  ngOnInit(): void {

    /*  $('.link-arrow').on('click', function() {
        let el = $(this);
        el.addClass('transition')
          .toggleClass('active rotate');

        !(el.hasClass('link-current'))
          ? el.addClass('link-current')
          : el.removeClass('link-current');

        el.next('.list-hidden').slideToggle('fast');
        if (el.parent().find('a').hasClass('down')) {
          el.toggleClass('rotate-revert')
        }
      });
  */
    //this.cargarDatos();
  }
/*
  irA(link) {
    if (link != '')
      this.router.navigate([link, {}]);
  }
*/
  nombreUsuario(){
    /*let user = JSON.parse(localStorage.getItem("user"));
    if (user)
      return user.user.toUpperCase();
    return '';*/
    return '';
  }

  menu:any = [ {
    "title": "user", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
      {
        "title": this.nombreUsuario(), "link": "", "icon": "fas fa-user", "class": '', 'ngclass': null, "submenu": [
          { "title": "Perfil", "link": "", "icon": "fas fa-key", "class": '', 'ngclass': null, "submenu": [] },
          { "title": "Cerrar Sesión", "link": "/logoff", "icon": "fas fa-lock", "class": '', 'ngclass': null, "submenu": [] },
        ]
      },
    ]
  },];
  menu_rol_administrador: any = [
    {
      "title": "user", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
        {
          "title": this.nombreUsuario(), "link": "", "icon": "fas fa-user", "class": '', 'ngclass': null, "submenu": [
            { "title": "Perfil", "link": "", "icon": "fas fa-key", "class": '', 'ngclass': null, "submenu": [] },
            { "title": "Cerrar Sesión", "link": "/logoff", "icon": "fas fa-lock", "class": '', 'ngclass': null, "submenu": [] },
          ]
        },
      ]
    },
    {
      "title": "REGISTROS", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
        {
          "title": "Formularios", "link": "", "icon": "fas fa-user", "class": '', 'ngclass': null, "submenu": [
            { "title": "Registrar nuevo", "link": "/formularios/seleccion", "icon": "fas fa-file", "class": '', 'ngclass': null, "submenu": [] },
            { "title": "Ver Registros", "link": "/formularios/listado", "icon": "fas fa-list", "class": '', 'ngclass': null, "submenu": [] },
          ]
        },
        { "title": "Importar", "link": "/formularios/importar", "icon": "fas fa-download", "class": '', 'ngclass': null, "submenu": [] },
        { "title": "Exportar", "link": "/formularios/exportar", "icon": "fas fa-upload", "class": '', 'ngclass': null, "submenu": [] },
      ]
    },
    {
      "title": "FORMULARIOS", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
        { "title": "Resumen", "link": "/resumen", "icon": "fas fa-chart-bar", "class": '', 'ngclass': null, "submenu": [] },
        {
          "title": "Administrar", "link": "", "current": true, "icon": "fas fa-hammer", "class": '', 'ngclass': null, "submenu": [
            { "title": "Crear Nuevo", "link": "/formularios/builder", "icon": "far fa-file", "current": true, "class": '', 'ngclass': null, "submenu": [] },
            { "title": "Formularios", "link": "/formularios", "icon": "far fa-edit", "current": true, "class": '', 'ngclass': null, "submenu": [] },
          ]
        },
        { "title": "Indicadores", "link": "/formularios/indicadores", "icon": "far fa-bell", "class": '', 'ngclass': null, "submenu": [] },
        {
          "title": "Gestor de datos", "link": "", "icon": "far fa-user", "class": '', 'ngclass': null, "submenu": [
            { "title": "Tabla de datos", "link": "/tablas", "icon": "fas fa-table", "class": '', 'ngclass': null, "submenu": [] },
          ]
        },
      ]
    },
    {
      "title": "ADMINISTRACIÓN", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
        {
          "title": "Accesos", "link": "", "current": true, "icon": "fas fa-hammer", "class": '', 'ngclass': null, "submenu": [
            { "title": "Users", "link": "/administracion/Users", "icon": "far fa-user", "current": true, "class": '', 'ngclass': null, "submenu": [] },
            { "title": "Grupos", "link": "/administracion/grupos", "icon": "far fa-user", "current": true, "class": '', 'ngclass': null, "submenu": [] },
          ]
        },
        { "title": "Establecimientos", "link": "/administracion/establecimientos", "icon": "fas fa-warehouse", "class": '', 'ngclass': null, "submenu": [] },
      ],
    },
    /*{
      "title": "AVISOS", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
        {
          "title": "Notificaciones", "link": "/dashboard", "icon": "far fa-user", "class": '', 'ngclass': null, "submenu": [], "badges": [
            { "bg": "bg-dark", "name": "Nuevo" }, { "bg": "bg-secondary", "name": "4" }
          ]
        },
      ]
    },*/

  ];
  menu_rol_registrador: any = [
    {
      "title": "user", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
        {
          "title": this.nombreUsuario(), "link": "", "icon": "fas fa-user", "class": '', 'ngclass': null, "submenu": [
            { "title": "Perfil", "link": "", "icon": "fas fa-key", "class": '', 'ngclass': null, "submenu": [] },
            { "title": "Cerrar Sesión", "link": "/logoff", "icon": "fas fa-lock", "class": '', 'ngclass': null, "submenu": [] },
          ]
        },
      ]
    },
    {
      "title": "REGISTROS", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
        {
          "title": "Formularios", "link": "", "icon": "fas fa-user", "class": '', 'ngclass': null, "submenu": [
            { "title": "Registrar nuevo", "link": "/formularios/seleccion", "icon": "fas fa-file", "class": '', 'ngclass': null, "submenu": [] },
            { "title": "Ver Registros", "link": "/formularios/listado", "icon": "fas fa-list", "class": '', 'ngclass': null, "submenu": [] },
          ]
        },
        { "title": "Importar", "link": "/importar", "icon": "fas fa-download", "class": '', 'ngclass': null, "submenu": [] },
        { "title": "Exportar", "link": "/exportar", "icon": "fas fa-upload", "class": '', 'ngclass': null, "submenu": [] },
      ]
    },
/*    {
      "title": "AVISOS", "link": "", "icon": "", "class": '', 'ngclass': null, "submenu": [
        {
          "title": "Notificaciones", "link": "/dashboard", "icon": "far fa-user", "class": '', 'ngclass': null, "submenu": [], "badges": [
            { "bg": "bg-dark", "name": "Nuevo" }, { "bg": "bg-secondary", "name": "4" }
          ]
        },
      ]
    },*/

  ];

}
