/*
**********************************************************************************
/* Genetic Algorithm implementation
/***********************************************************************************/

class GeneticAlgorithm {
  public static SCALE_FACTOR = 200 // the factor used to scale normalized input values
  public max_units: number
  public top_units: number
  // public Population: Array<synaptic.Architect.Perceptron>;
  public Population: Array<any>

  private iteration: number
  private mutateRate: number
  private best_population: number
  private best_fitness: number
  private best_score: number

  constructor(max_units: number, top_units: number) {
    this.max_units = max_units // max number of units in population
    this.top_units = top_units // number of top units (winners) used for evolving population

    if (this.max_units < this.top_units) this.top_units = this.max_units

    this.Population = [] // array of all units in current population

    this.iteration = 1 // current iteration number (it is equal to the current population number)
    this.mutateRate = 1 // initial mutation rate

    this.best_population = 0 // the population number of the best unit
    this.best_fitness = 0 // the fitness of the best unit
    this.best_score = 0 // the score of the best unit ever
  }

  // GeneticAlgorithm.prototype = {
  // resets genetic algorithm parameters
  public reset() {
    this.iteration = 1 // current iteration number (it is equal to the current population number)
    this.mutateRate = 1 // initial mutation rate

    this.best_population = 0 // the population number of the best unit
    this.best_fitness = 0 // the fitness of the best unit
    this.best_score = 0 // the score of the best unit ever
  }

  // creates a new population
  public createPopulation() {
    // clear any existing population
    this.Population.splice(0, this.Population.length)

    for (var i = 0; i < this.max_units; i++) {
      // create a new unit by generating a random Synaptic neural network
      // with 2 neurons in the input layer, 6 neurons in the hidden layer and 1 neuron in the output layer
      var newUnit = new synaptic.Architect.Perceptron(2, 6, 1) as any

      // set additional parameters for the new unit
      newUnit.index = i
      newUnit.fitness = 0
      newUnit.score = 0
      newUnit.isWinner = false

      // add the new unit to the population
      this.Population.push(newUnit)
    }
  }

  // activates the neural network of an unit from the population
  // to calculate an output action according to the inputs
  public activateBrain(bird: any, target: any) {
    // input 1: the horizontal distance between the bird and the target
    var targetDeltaX =
      this.normalize(target.x, 700) * GeneticAlgorithm.SCALE_FACTOR

    // input 2: the height difference between the bird and the target
    var targetDeltaY =
      this.normalize(bird.y - target.y, 800) * GeneticAlgorithm.SCALE_FACTOR

    // create an array of all inputs
    var inputs = [targetDeltaX, targetDeltaY]

    // calculate outputs by activating synaptic neural network of this bird
    var outputs = this.Population[bird.index].activate(inputs)

    // perform flap if output is greater than 0.5
    if (outputs[0] > 0.5) bird.flap()
  }

  // evolves the population by performing selection, crossover and mutations on the units
  public evolvePopulation() {
    // select the top units of the current population to get an array of winners
    // (they will be copied to the next population)
    var Winners = this.selection()

    if (this.mutateRate == 1 && Winners[0].fitness < 0) {
      // If the best unit from the initial population has a negative fitness
      // then it means there is no any bird which reached the first barrier!
      // Playing as the God, we can destroy this bad population and try with another one.
      this.createPopulation()
    } else {
      this.mutateRate = 0.2 // else set the mutatation rate to the real value
    }

    // fill the rest of the next population with new units using crossover and mutation
    for (var i = this.top_units; i < this.max_units; i++) {
      var parentA, parentB, offspring

      if (i == this.top_units) {
        // offspring is made by a crossover of two best winners
        parentA = Winners[0].toJSON()
        parentB = Winners[1].toJSON()
        offspring = this.crossOver(parentA, parentB)
      } else if (i < this.max_units - 2) {
        // offspring is made by a crossover of two random winners
        parentA = this.getRandomUnit(Winners).toJSON()
        parentB = this.getRandomUnit(Winners).toJSON()
        offspring = this.crossOver(parentA, parentB)
      } else {
        // offspring is a random winner
        offspring = this.getRandomUnit(Winners).toJSON()
      }

      // mutate the offspring
      offspring = this.mutation(offspring)

      // create a new unit using the neural network from the offspring
      var newUnit = synaptic.Network.fromJSON(offspring) as any
      newUnit.index = this.Population[i].index
      newUnit.fitness = 0
      newUnit.score = 0
      newUnit.isWinner = false

      // update population by changing the old unit with the new one
      this.Population[i] = newUnit
    }

    // if the top winner has the best fitness in the history, store its achievement!
    if (Winners[0].fitness > this.best_fitness) {
      this.best_population = this.iteration
      this.best_fitness = Winners[0].fitness
      this.best_score = Winners[0].score
    }

    // sort the units of the new population	in ascending order by their index
    this.Population.sort(function (unitA, unitB) {
      return unitA.index - unitB.index
    })
  }

  // selects the best units from the current population
  public selection() {
    // sort the units of the current population	in descending order by their fitness
    var sortedPopulation = this.Population.sort(function (unitA, unitB) {
      return unitB.fitness - unitA.fitness
    })

    // mark the top units as the winners!
    for (var i = 0; i < this.top_units; i++) this.Population[i].isWinner = true

    // return an array of the top units from the current population
    return sortedPopulation.slice(0, this.top_units)
  }

  // performs a single point crossover between two parents
  public crossOver(parentA: any, parentB: any) {
    // get a cross over cutting point
    var cutPoint = this.random(0, parentA.neurons.length - 1)

    // swap 'bias' information between both parents:
    // 1. left side to the crossover point is copied from one parent
    // 2. right side after the crossover point is copied from the second parent
    for (var i = cutPoint; i < parentA.neurons.length; i++) {
      var biasFromParentA = parentA.neurons[i]['bias']
      parentA.neurons[i]['bias'] = parentB.neurons[i]['bias']
      parentB.neurons[i]['bias'] = biasFromParentA
    }

    return this.random(0, 1) == 1 ? parentA : parentB
  }

  // performs random mutations on the offspring
  public mutation(offspring: any) {
    // mutate some 'bias' information of the offspring neurons
    for (var i = 0; i < offspring.neurons.length; i++) {
      offspring.neurons[i]['bias'] = this.mutate(offspring.neurons[i]['bias'])
    }

    // mutate some 'weights' information of the offspring connections
    for (var i = 0; i < offspring.connections.length; i++) {
      offspring.connections[i]['weight'] = this.mutate(
        offspring.connections[i]['weight']
      )
    }

    return offspring
  }

  // mutates a gene
  public mutate(gene: any) {
    if (Math.random() < this.mutateRate) {
      var mutateFactor = 1 + ((Math.random() - 0.5) * 3 + (Math.random() - 0.5))
      gene *= mutateFactor
    }

    return gene
  }

  public random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  public getRandomUnit(array: Array<any>) {
    return array[this.random(0, array.length - 1)]
  }

  public normalize(value: number, max: number) {
    // clamp the value between its min/max limits
    if (value < -max) value = -max
    else if (value > max) value = max

    // normalize the clamped value
    return value / max
  }
}
