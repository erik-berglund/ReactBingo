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
  squares: SquaresMap
}

class App extends React.Component<AppProps, AppState> {

  state: AppState = {
    playerName: "",
    squares: this.buildSquaresMap(this.props.dimension)
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

  resetSquares() {
    this.setState({
      squares: this.buildSquaresMap(this.props.dimension)
    });
  }

  draw(): void {
    // Get available squares
    const available = Array.from(this.state.squares.values()).filter(squareData => !squareData.drawn);
    
    if (!available.length) {
      return;
    }
   
    // Randomly pick one
    const randomIndexWithinAvailableRange = Math.floor(Math.random() * available.length); // Exclusive
    const randomSquare = available[randomIndexWithinAvailableRange];
    
    // Copy state
    const tmpSquares: SquaresMap = new Map(this.state.squares);
    
    // Mark random square drawn
    tmpSquares.set(randomSquare.value, {...randomSquare, drawn: true});

    this.setState({
      squares: tmpSquares
    }, this.checkForBingo);
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
        
        <div className="playerNameContainer">
          Your name: <div className="playerName" contentEditable="true"></div>
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

        <button className="playAgain" onClick={() => this.resetSquares()}>Reset and play again</button>
      
      </div>
    );
  }
}

export default App;
