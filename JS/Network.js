class Network{
    static request(httpMessage){
        // randomly send 500 ERROR code - the server is not responding
        httpMessage.readyState = 1; // 1: server connection established
        if(Math.floor(Math.random() * 10) === 0){
            httpMessage.response_message  = new Message();
            httpMessage.response_message.status = "503 Service Unavailable";

            this.response(httpMessage);
        } else{
            get_server().parseMessage(httpMessage, this.response);
        }
    }

    static response(httpMessage){
        httpMessage.readyState = 4; // 4: request finished and response is ready
        httpMessage.onload();
    }

}
