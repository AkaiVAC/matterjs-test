import {
  Bodies,
  Common,
  Composites,
  Constraint,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Render,
  World,
} from 'matter-js';

const engine = Engine.create();
engine.world.gravity = {
  x: 0,
  y: 1,
  scale: 0.001,
};
Engine.run(engine);

const render = Render.create({
  element: document.body,
  engine,
  options: { width: 1600, height: 900, wireframes: false },
});
Render.run(render);

const wallThickness = 200;
const walls = [
  Bodies.rectangle(
    -wallThickness / 2,
    -wallThickness / 2,
    wallThickness,
    render.options.height * 3,
    {
      isStatic: true,
    },
  ),
  Bodies.rectangle(
    -wallThickness / 2,
    -wallThickness / 2,
    render.options.width * 3,
    wallThickness,
    {
      isStatic: true,
    },
  ),
  Bodies.rectangle(
    render.options.width + wallThickness / 2,
    0,
    wallThickness,
    render.options.height * 3,
    {
      isStatic: true,
    },
  ),
  Bodies.rectangle(
    render.options.width + wallThickness / 2,
    render.options.height + wallThickness / 2,
    render.options.width * 3,
    wallThickness,
    {
      isStatic: true,
    },
  ),
];

const stack = Composites.stack(
  render.options.width / 2,
  render.options.height / 2,
  4,
  4,
  0,
  0,
  (x, y) => {
    return Bodies.polygon(x, y, 8, 15, { friction: Common.random(10, 20) });
  },
);

let ball = Bodies.circle(150, 350, 10, { restitution: 1, density: 2 });
const sling = Constraint.create({
  pointA: { x: ball.position.x, y: ball.position.y },
  bodyB: ball,
  stiffness: 0.05,
});

const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { render: { visible: false } },
});

let firing = false;
Events.on(mouseConstraint, 'enddrag', (e) => {
  if (e.body === ball) firing = true;
});

var explosion = function (engine) {
  var bodies = Composite.allBodies(engine.world);

  for (var i = 0; i < bodies.length; i++) {
    var body = bodies[i];

    if (!body.isStatic && body.position.y >= 500) {
      var forceMagnitude = 0.05 * body.mass;

      Body.applyForce(body, body.position, {
        x:
          (forceMagnitude + Common.random() * forceMagnitude) *
          Common.choose([1, -1]),
        y: -forceMagnitude + Common.random() * -forceMagnitude,
      });
    }
  }
};
var timeScaleTarget = 1,
  counter = 0;
Events.on(engine, 'afterUpdate', () => {
  if (
    firing &&
    Math.abs(ball.position.x - 150) < 10 &&
    Math.abs(ball.position.y - 350) < 10
  ) {
    ball = Bodies.circle(150, 350, 10);
    World.add(engine.world, ball);
    sling.bodyB = ball;
    firing = false;
  }

  engine.timing.timeScale += (timeScaleTarget - engine.timing.timeScale) * 0.05;

  counter += 1;

  // every 1.5 sec
  if (counter >= 60 * 1.5) {
    // flip the timescale
    if (timeScaleTarget < 1) {
      timeScaleTarget = 1;
    } else {
      timeScaleTarget = 0.05;
    }

    // create some random forces
    explosion(engine);

    // reset counter
    counter = 0;
  }
});

render.mouse = mouse;
World.add(engine.world, [...walls, ball, sling, stack, mouseConstraint]);
