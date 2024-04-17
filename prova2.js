for ( let i=0; i<2 ; i++) {
    process.nextTick( () => {
    console.log('nextTick'); // microtask
    setImmediate( () => console.log('setImmediate') ); // macrotask
    } )
    console.log('main'); // main
    }