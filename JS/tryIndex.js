//changing pages
function showPage(pageName) {
    var html = document.getElementById('t-' + pageName).innerHTML;
    var main = document.querySelector('main');

    main.innerHTML = html;
}

function setPageFromHash() {
    var hash = window.location.hash.substr(1);

    if (hash === 'login') {
        showPage('login');
    }
    else if (hash === 'signup') {
        showPage('signup');
    }
    else {
        showPage('contact');
        reloadPage();
        //showContacts();
    }
}

window.addEventListener("hashchange", setPageFromHash);
setPageFromHash();



//////////////////////////////////////////////////////

function reloadPage() {

    var obj = new FXMLHttpRequest();
    obj.open('GET');
    obj.onload = function () {
        var container = document.getElementById("info");
        console.log(this.response)
        container.innerHTML = null
        for (let i of this.response) {
            if (i) {
                let child = `<div>
                    ${i.firstName} ${i.lastName} ${i.phone} 
                    <button id='${i.id}' onclick='editContact(${JSON.stringify(i)})'>edit</button> 
                    <button onclick='deleteContact(${JSON.stringify(i)})'>delete</button>
                </div>`
                container.innerHTML += child;
            }


            // document.getElementById('button' + i.id).addEventListener('click', () => editPrompt(i))
        }
    }
    obj.send();
}

var obj;
//add new contact
function newContact() {
    var obj = new FXMLHttpRequest();
    var data = addPrompt();
    obj.open('POST', null, data);
    obj.onload = function () {
        var container = document.getElementById("info");
        let child = `<div>
            ${this.response.firstName} ${this.response.lastName} ${this.response.phone} 
            <button onclick='editPrompt(${JSON.stringify(this.response)})'>edit</button>
            <button onclick='deleteContact(${JSON.stringify(this.response)})'>delete</button>
        </div>`
        container.innerHTML += child;

    }
    console.log(obj.response);
    obj.send(data);

}

function addPrompt() {
    var arr = [];
    arr.push(prompt("enter first name:"));
    arr.push(prompt("enter last name:"));
    arr.push(prompt("enter phone number:"));
    console.log(arr);
    return arr;
}

//excepting edit data
function editPrompt(contact) {
    var arr = [];
    arr.push(contact.id);

    arr.push(prompt("enter first name:", contact.firstName));
    arr.push(prompt("enter last name:", contact.lastName));
    arr.push(prompt("enter phone number:", contact.phone));
    console.log(arr);
    return arr;
}

function editContact(contact) {
    var obj = new FXMLHttpRequest();
    var data = editPrompt(contact);
    obj.open('PUT', null, data);
    obj.onload = function () {
        reloadPage()
    }
    obj.send(data);

}


function deleteContact(contact) {
    console.log("fe")
    var obj = new FXMLHttpRequest();

    obj.open('DELETE', contact.id);
    obj.onload = function () {
        reloadPage()
        window.reloadPage()

    }
    obj.send();
}

