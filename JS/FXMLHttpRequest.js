class FXMLHttpRequest{
    constructor(){
        this.readyState = 0; // 0: request not initialized
    }

    open(method, url){ // specifies the request
        this.request_message = new Message();
        this.request_message.url = url;
        this.request_message.method = method;
    }

    send(body = {}){ // sends the request
        this.request_message.body = body;
        Network.request(this);
    }

    set onload(callback){ // a callback function the FXMLHttpRequest will call once the response is received
        this.onload_func = callback;
    }

    get onload(){ // a callback function the FXMLHttpRequest will call once the response is received
        return this.onload_func;
    }
}
