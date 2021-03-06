import Easing from "properjs-easing";
import Tween from "properjs-tween";
import PageController from "properjs-pagecontroller";
import $ from "js_libs/hobo/dist/hobo.build";
import * as core from "./core";
import about from "./about";
import indexes from "./indexes";
import listing from "./indexes/listing";
import projects from "./projects";
import overlay from "./overlay";
import gallery from "./gallery";
import Project from "./projects/Project";


/**
 *listing
 * @public
 * @namespace router
 * @description Handles async web app routing for nice transitions.
 *
 */
const router = {
    /**
     *
     * @public
     * @method init
     * @memberof router
     * @description Initialize the router module.
     *
     */
    init () {
        console.log('Router start init');
        this.state = {};
        this.navData = core.dom.nav.data();
        this.pageData = core.dom.page.data();
        this.pageDuration = core.util.getTransitionDuration( core.dom.page[ 0 ] );
        this.tweenScroll = null;
        this.$rootPanel = core.dom.main.find( ".js-main--garberco" );
        this.prepPage();
        this.bindEmptyHashLinks();
        this.initPageController();

        core.log( "router initialized" );
    },


    /**
     *
     * @public
     * @method setState
     * @memberof router
     * @param {string} name The access key
     * @param {mixed} value The storage value
     * @description Non-persistent state.
     *              This state object will persist for one router cycle.
     *              The next router cycle will delete this state object.
     *
     */
    setState ( name, value ) {
        this.state[ name ] = {
            checked: false,
            name,
            value
        };
    },


    /**
     *
     * @public
     * @method getState
     * @memberof router
     * @param {string} name The access key
     * @description Access a state object ref by its name.
     * @returns {mixed}
     *
     */
    getState ( name ) {
        let id = null;
        let ret = null;

        for ( id in this.state ) {
            if ( this.state.hasOwnProperty( id ) ) {
                if ( this.state[ id ].name === name ) {
                    ret = this.state[ id ].value;
                    break;
                }
            }
        }

        return ret;
    },


    /**
     *
     * @public
     * @method checkState
     * @memberof router
     * @description Process state objects.
     *              Objects that have already been `checked` are deleted.
     *
     */
    checkState () {
        let id = null;

        for ( id in this.state ) {
            if ( this.state.hasOwnProperty( id ) ) {
                if ( this.state[ id ].checked ) {
                    delete this.state[ id ];

                } else {
                    this.state[ id ].checked = true;
                }
            }
        }
    },


    /**
     *
     * @public
     * @method route
     * @param {string} path The uri to route to
     * @memberof router
     * @description Trigger app to route a specific page. [Reference]{@link https://github.com/ProperJS/Router/blob/master/Router.js#L222}
     *
     */
    route ( path ) {
        this.controller.getRouter().trigger( path );
    },


    /**
     *
     * @public
     * @method push
     * @param {string} path The uri to route to
     * @param {function} cb Optional callback to fire
     * @memberof router
     * @description Trigger a silent route with a supplied callback.
     *
     */
    push ( path, cb ) {
        this.controller.routeSilently( path, (cb || core.util.noop) );
        this.checkState();
    },


    /**
     *
     * @public
     * @method redirect
     * @memberof router
     * @description Handle 404 / Invalid page hit.
     *
     */
    redirect () {
        window.location.href = window.location.origin;
    },


    /**
     *
     * @public
     * @method initPageController
     * @memberof router
     * @description Create the PageController instance.
     *
     */
    initPageController () {
        console.log('START initPageController');
        this.controller = new PageController( {} );

        this.controller.setConfig([
            "*"
        ]);

        this.controller.setModules([
            about,
            indexes,
            listing,
            projects
        ]);

        this.controller.on( "page-controller-router-transition-out", this.changePageOut.bind( this ) );
        this.controller.on( "page-controller-router-refresh-document", this.changeContent.bind( this ) );
        this.controller.on( "page-controller-router-transition-in", this.changePageIn.bind( this ) );
        this.controller.on( "page-controller-initialized-page", this.initPage.bind( this ) );
        this.controller.on( "page-controller-router-samepage", this.samePage.bind( this ) );

        this.controller.initPage();
    },


    /**
     *
     * @public
     * @method prepPage
     * @memberof router
     * @description Perform actions before PageController init callback.
     *
     */
    prepPage () {
        this.root = null;

        // Index?
        // Indexes will already have the root gridwall loaded
        // Offcanvas/Project paths will need to manually load the root index
        debugger;
        if ( this.pageData.type !== "index" ) {
            if ( this.pageData.type === "offcanvas" ) {
                this.root = "/";

            } else {
                this.navData.appTree.forEach(( indexItem ) => {
                    if ( indexItem.items ) {
                        indexItem.items.forEach(( collectionItem ) => {
                            if ( collectionItem.collection.id === this.pageData.id ) {
                                this.root = indexItem.collection.fullUrl;
                            }
                        });
                    }
                });
            }

            this.root = (this.root || "/");
            this.loadRootIndex();

        } else {
            this.root = window.location.pathname;
        }

        core.dom.root.attr( "href", this.root );

        core.dom.root.on( "click", () => {
            core.dom.html.removeClass( core.config.offcanvasClasses );

            core.emitter.fire( "app--root" );
        });

        core.emitter.on( "app--project-ended", () => {
            if ( !this.isPop ) {
                this.route( this.root );
            }
        });
    },


    /**
     *
     * @public
     * @method initPage
     * @param {object} data The PageController data object
     * @memberof router
     * @description Perform actions after PageController init callback.
     *
     */
    initPage ( /* data */ ) {
        debugger;
        core.dom.nav.detach();
        core.dom.page.detach();

        core.dom.html.removeClass( "is-clipped" );
        core.dom.body.removeClass( "is-clipped" );
        debugger;
        window.addEventListener( "popstate", this.handlePopstate.bind( this ), false );
    },


    /**
     *
     * @public
     * @method samePage
     * @memberof router
     * @description Handle logo click on root index, or homepage.
     *
     */
    samePage () {
        if ( window.location.pathname === this.root && !this.tweenScroll && this.$rootPanel[ 0 ].scrollTop > 0 ) {
            this.tweenScroll = new Tween({
                to: 0,
                from: this.$rootPanel[ 0 ].scrollTop,
                ease: Easing.easeInOutCubic,
                update: ( top ) => {
                    this.$rootPanel[ 0 ].scrollTop = top;
                },
                complete: () => {
                    this.tweenScroll = null;
                },
                duration: 400
            });
        }
    },


    /**
     *
     * @public
     * @method handlePopstate
     * @memberof router
     * @description Process actions to take on popstate.
     *
     */
    handlePopstate () {
        debugger;
        this.isPop = true;
        let $tile = null;
        let match = window.location.pathname.match( /^\/$|^\/about\/$|^\/index\/$/g );


        // GarberCo?
        // About?
        // Index?
        if ( match && match[ 0 ] ) {
            match = match[ 0 ].replace( /\//g, "" );
            match = match ? match : "garberco";

            core.dom.main[ 0 ].id = `is-main--${match}`;

            // GarberCo?
            if ( match === core.config.rootUrlId ) {
                core.dom.html.removeClass( core.config.offcanvasClasses );
                //core.dom.html.removeClass( "is-neverflow" );
            }

            // Project?
            if ( Project.isActive() ) {
                core.emitter.fire( "app--project-ended" );
            }

            // Overlay?
            overlay.close();

        // Project?
        } else {
            $tile = $( `.js-index-tile[href*='${window.location.pathname}']` );
            $tile.trigger( "mouseenter" );
            $tile.trigger( "click" );
        }

        // Gallery?
        console.log('Gallery CLose');
        gallery.close();

        this.isPop = false;
    },


    /**
     *
     * @public
     * @method loadRootIndex
     * @memberof router
     * @description Load the parent Index for the current collection.
     *
     */
    loadRootIndex () {
        core.api.collection(
            this.root,
            { format: "html" },
            { dataType: "html" }

        ).then(( response ) => {
            const doc = this.parseDoc( response );

            core.emitter.fire( "app--load-root", doc.pageHtml );
        });
    },


    /**
     *
     * @public
     * @method loadFullIndex
     * @param {function} cb The callback to fire
     * @memberof router
     * @description Load the parent Index JSON to render full Index view.
     *
     */
    loadFullIndex ( cb ) {
        core.api.collection(
            this.root,
            { format: "json" },
            { dataType: "json" }

        ).then( cb );
    },


    /**
     *
     * @public
     * @method parseDoc
     * @param {string} html The responseText to parse out
     * @memberof router
     * @description Get the DOM information to cache for a request.
     * @returns {object}
     *
     */
    parseDoc ( html ) {
        let doc = document.createElement( "html" );

        doc.innerHTML = html;

        doc = $( doc );

        return {
            $doc: doc,
            $page: doc.find( ".js-page" ),
            pageHtml: doc.find( ".js-page" )[ 0 ].innerHTML
        };
    },


    /**
     *
     * @public
     * @method bindEmptyHashLinks
     * @memberof router
     * @description Suppress #hash links.
     *
     */
    bindEmptyHashLinks () {
        core.dom.body.on( "click", "[href^='#']", ( e ) => e.preventDefault() );
    },


    /**
     *
     * @public
     * @method changePageOut
     * @memberof router
     * @description Trigger transition-out animation.
     *
     */
    changePageOut () {
        core.dom.html.addClass( "is-routing" );
    },


    /**
     *
     * @public
     * @method changeContent
     * @param {object} data The PageController data object
     * @memberof router
     * @description Swap the new content into the DOM.
     *
     */
    changeContent ( data ) {
        const doc = this.parseDoc( data.response );

        core.dom.page[ 0 ].innerHTML = doc.pageHtml;

        core.emitter.fire( "app--analytics-push", doc.$doc );

        this.pageData = doc.$page.data();

        // Check state before cycle finishes so `checked` state can be deleted
        this.checkState();
    },


    /**
     *
     * @public
     * @method changePageIn
     * @param {object} data The data object supplied by PageController from PushState
     * @memberof router
     * @description Trigger transition-in animation.
     *
     */
    changePageIn ( /* data */ ) {
        core.dom.html.removeClass( "is-routing" );
    }
};



/******************************************************************************
 * Export
*******************************************************************************/
export default router;
