import React from 'react';
import classNames from 'classnames';
import './App.scss';

type Square = {
  value: number,
  row: number;
  col: number;
  drawn: boolean;
  inBingo: boolean;
}

type SquaresMap = Map<number, Square>;

type AppProps = {
  dimension: number
}

type AppState = {
  playerName: string | null, // We're not storing this right now...
  squares: SquaresMap,
  drawHistory: Set<number>
}

class App extends React.Component<AppProps, AppState> {

  state: AppState = {
    playerName: "",
    squares: this.buildSquaresMap(this.props.dimension),
    drawHistory: new Set()
  };

  buildSquaresMap(dimension: number): SquaresMap {
    const returnMap: SquaresMap = new Map();
    let tmpArray: number[];
    
    let delta: number; // For storing the value minimum for a column

    // Each column can contain (dimension * 3) different numbers, hence
    // the total available set of numbers is (dimension * (dimension * 3))
    // Eg. when dimension = 5, the possible numbers are 1-75 divided into 5 columns
    for (let columnIndex = 0; columnIndex < dimension; columnIndex++) {

      delta = (columnIndex * dimension * 3) + 1; // For dimension = 5 delta will be 1, 16, 31, etc.

      // First, build an array with all the possible numbers in a column
      // https://stackoverflow.com/questions/3746725/how-to-create-an-array-containing-1-n
      tmpArray = Array.from({length: dimension * 3}, (_, j) => delta + j);
      
      // Then, sort them randomly (50% chance)
      // https://stackoverflow.com/questions/26718637/populate-array-with-unique-random-numbers-javascript
      tmpArray.sort(() => Math.random() - 0.5);
      
      // Finally, select only the needed subset
      tmpArray = tmpArray.slice(0, dimension);

      // Insert each value to SquaresMap, keyed by value, containing metadata for row and col
      tmpArray.forEach((squareValue, rowIndex) => {
        returnMap.set(squareValue, {
          value: squareValue,
          row: rowIndex,
          col: columnIndex,
          inBingo: false,
          drawn: false
        });
      });
    }
    
    return returnMap;
  }

  resetGame() {
    this.setState({
      squares: this.buildSquaresMap(this.props.dimension),
      drawHistory: new Set()
    });
  }

  draw(): void {
    // Get available squares
    // Could be stored in state, alternatively the array of possible numbers could be there.
    // Alternative solution eg. to loop 
    const availableRange = Array
      .from({length: this.props.dimension * this.props.dimension * 3}, (_, i) => i + 1)
      .filter(entry => !this.state.drawHistory.has(entry));

    console.debug(availableRange);

    if (!availableRange.length) {
      return;
    }

    // Randomly pick one
    const randomNumberWithinAvailableRange = availableRange[Math.floor(Math.random() * availableRange.length)];
    
    console.debug(randomNumberWithinAvailableRange);

    // Copy drawHistory state
    const tmpDrawHistory: Set<number> = new Set(this.state.drawHistory);
    tmpDrawHistory.add(randomNumberWithinAvailableRange);
    
    this.setState({
      drawHistory: tmpDrawHistory
    });


    // Try to see if this square is on our board
    const randomSquare = this.state.squares.get(randomNumberWithinAvailableRange);

    if (randomSquare) {
      // Copy squares state
      const tmpSquares: SquaresMap = new Map(this.state.squares);
    
      // Mark random square drawn
      tmpSquares.set(randomSquare.value, {...randomSquare, drawn: true});

      this.setState({
        squares: tmpSquares
      }, this.checkForBingo);
    }
  }

  checkForBingo(): void {

    let accumulatorSquares: SquaresMap = new Map(this.state.squares);
    const allSquaresArray = Array.from(this.state.squares.values());

    // A memoized selector would be better, eg. reselect with a data
    // structure where rows, cols and diagonals are separated somehow.

    // Check rows and columns
    for (let i = 0; i < this.props.dimension; i++) {
      [ allSquaresArray.filter(squareData => (squareData.drawn && squareData.row == i)),
        allSquaresArray.filter(squareData => (squareData.drawn && squareData.col == i))
      ].forEach(squaresToCheck => {
        accumulatorSquares = this.checkAndUpdateBingoState(
          accumulatorSquares, squaresToCheck
        );
      });
    }

    // For topLeft-bottomRight diagonal, row == col
    // For bottomLeft-topRight diagonal, row + col == dimension - 1
    [ allSquaresArray.filter(squareData => (squareData.drawn && squareData.row == squareData.col)),
      allSquaresArray.filter(squareData => (squareData.drawn && squareData.row + squareData.col == this.props.dimension - 1))
    ].forEach(squaresToCheck => {
      accumulatorSquares = this.checkAndUpdateBingoState(
        accumulatorSquares, squaresToCheck
      );
    });

    this.setState({
      squares: accumulatorSquares
    });
  }

  checkAndUpdateBingoState(accumulator: SquaresMap, squaresToCheck: Square[]): SquaresMap {
    if (squaresToCheck.length >= this.props.dimension) { // Should never be >, but you never know :)
      squaresToCheck.forEach(squareData => {
        accumulator.set(squareData.value, {...squareData, inBingo: true});
      })
    }

    return accumulator;
  }

  render() {
    return (
      <div className="App">

        <div className="drawnNumbersContainer">
          { Array.from(this.state.drawHistory).map(square => (
            <span
              key={square}
              className={classNames({
                "found": this.state.squares.has(square)
              })}
            >{square}</span>  
          ))}
        </div>
        
        <div className="playerNameContainer">
          { !this.state.playerName && <span>Your name: </span> }
          <div className="playerName" contentEditable={true}
            onBlur={e => this.setState({ playerName: e.currentTarget.textContent })}></div>
          <button onClick={() => this.draw()}>Draw</button>
        </div>

        <div className="bingo" style={{
          gridTemplateColumns: `repeat(${this.props.dimension}, minmax(50px, 100px))`,
          gridTemplateRows: `repeat(${this.props.dimension}, 1fr)`
        }}>
          { Array.from(this.state.squares.values()).map(squareData =>
            <div
              key={squareData.value}
              className={classNames(
                "square", {
                  drawn: squareData.drawn,
                  inBingo: squareData.inBingo
                }
              )}>
              <span>{squareData.value}</span>
            </div>
          )}
        </div>

        <button className="playAgain" onClick={() => this.resetGame()}>Reset and play again</button>
      
      </div>
    );
  }
}

export default App;
