import log from "./log";
import util from "./util";


// Singleton
let _instance = null;
let _initialized = false;

// Session Storage
let _cache = {};
const _access = "garberco-cache";
const _session = window.sessionStorage;


/**
 *
 * @public
 * @class Store
 * @param {object} options The Store settings
 * @classdesc Handles how data / content is cached and stored for webapp.
 *
 */
class Store {
    constructor ( options ) {
        if ( !_instance ) {
            _instance = this;

            this._opts = options;
            this._init();
        }

        return _instance;
    }


    /**
     *
     * @private
     * @instance
     * @method _init
     * @memberof Store
     * @description One time Store initialization
     *
     */
    _init () {
        if ( _initialized ) {
            return;
        }

        _initialized = true;

        this.flush();

        log( "Singleton Store initialized", this );
    }


    /**
     *
     * @public
     * @instance
     * @method flush
     * @memberof Store
     * @description Manually flush the Local Storage cache
     *
     */
    flush () {
        // New empty cache
        _cache = {};

        // Store the new cache object
        this.save();
    }


    /**
     *
     * @public
     * @instance
     * @method save
     * @memberof Store
     * @description Perform the actual synchronous write to Local Storage
     *
     */
    save () {
        if ( !this._opts.enableStorage || !Store.isStorageSupported ) {
            log( "Cache Storage disabled - Not writing to SessionStorage" );
            return;
        }

        _session.setItem( _access, JSON.stringify( _cache ) );
    }


    /**
     *
     * @public
     * @instance
     * @method set
     * @param {string} id The index key
     * @param {mixed} val The value to store
     * @memberof Store
     * @description Set a key's value in the cache
     *
     */
    set ( id, val ) {
        id = util.slugify( id );

        _cache[ id ] = val;

        this.save();
    }


    /**
     *
     * @public
     * @instance
     * @method get
     * @param {string} id The index key
     * @memberof Store
     * @description Get a key's value from the cache
     * @returns {mixed}
     *
     */
    get ( id ) {
        id = (id && util.slugify( id ));

        return (id ? this.getValue( _cache[ id ] ) : _cache);
    }


    /**
     *
     * @public
     * @instance
     * @method getValue
     * @param {mixed} val The accessed value
     * @memberof Store
     * @description Get a value so cache is non-mutable from outside
     * @returns {mixed}
     *
     */
    getValue ( val ) {
        return (typeof val === "string" ? String( val ) : val ? util.extendObject( (Array.isArray( val ) ? [] : {}), val ) : null);
    }


    /**
     *
     * @public
     * @instance
     * @method remove
     * @param {string} id The index key
     * @memberof Store
     * @description Remove a key/val pair from the cache
     *
     */
    remove ( id ) {
        delete _cache[ id ];
    }
}



/**
 *
 * @public
 * @static
 * @member isStorageSupported
 * @memberof Store
 * @description Boolean to test local/session storage support
 *
 */
Store.isStorageSupported = (function () {
    let ret = true;

    try {
        _session.setItem( "garberco-test", 1 );
        _session.removeItem( "garberco-test" );

    } catch ( err ) {
        ret = false;
    }

    return ret;
})();



/******************************************************************************
 * Export
*******************************************************************************/
export default Store;