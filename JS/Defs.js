class Message {
    set method(met){
        this.request_method = met;
    }
    
    get method(){
        return this.request_method;
    }

    set url(url_string){
        this.url_request = url_string;
    }
    
    get url(){
        return this.url_request;
    }

    set status_code(status) {
        this.status = status;
    }

    get status_code(){
        return this.status;
    }

    set body(body) {
        this.body_data = body;
    }

    get body() {
        return this.body_data;
    }
}



/**
 *  Singlton-like parameters - 
 *      access to the DB, Server and Network without creating new instances 
 *      with every generation of FXMLHttpRequest.
 */
var get_db = (() =>{
    const global_data_base = new DB();
    return () => {
        return global_data_base;
    };
}) ();

var get_server = (() =>{
    const global_server = new Server();
    return () => {
        return global_server;
    };
}) ();

var get_network = (() => {
    const global_network = new Network();
    return () => {
        return global_network;
    };
}) ();
