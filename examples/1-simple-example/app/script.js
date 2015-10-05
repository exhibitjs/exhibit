class Cool {
  constructor(m) {
    this.message = m;
  }

  announce() {
    console.log(this.message);
  }
}

new Cool('babel is working!').announce();
