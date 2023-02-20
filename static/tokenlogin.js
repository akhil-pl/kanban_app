Vue.component('token-login', {
    template: `
    <div class="waper">
    <div class="head">Login </div>
    
    <form action="" method="get">
      <div class="foc">
        <input id="email" type="text" class="form-control" placeholder="email">
        </div>
        <div class="foc">
         <input id="password" type="password" class="form-control"  placeholder="Password" autocomplete="off" >
        </div>
        <div class="foc" >
                  <button type="button" class="btn btn-outline-primary" v-on:click="Login">Login</button>
              </div>
    </form>
    
    </div>
        `,
    data: function () {
        return {
            object: null,
            auth_token: null
        }
    },
    methods: {
        async Login() { //function to fetch auth token and save in local storage
            emailEl = document.getElementById('email')
            passwordEl = document.getElementById('password')
            email = emailEl.value
            password = passwordEl.value
            if (!email) {
                alert('Email is required.');
                return; // exit function
            }
            if (!password) {
                alert('Password is required.');
                return;
            }
            data = { "email": email, "password": password };
            console.log(data)
            url = "http://localhost:8080/login?include_auth_token"
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
                .then(response => response.json())
                .then(data => this.object = data['response'])
                .catch((error) => {
                    console.error('Error:', error);
                });
            //console.log("Type of object:", typeof(this.object), this.object);
            user = this.object['user'];
            this.auth_token = user['authentication_token'];
            console.log(this.auth_token);
            key = "auth_token"
            window.localStorage.setItem(key, this.auth_token);
            //console.log("Type of object", typeof(this.object), this.object);
            window.location.href = 'http://localhost:8080/you';
        }
    }
})




var app = new Vue({
    el: "#token"
});