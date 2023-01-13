import React, { useState, useEffect } from 'react';
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

const buildSquaresMap = (dimension: number) => {
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

const App = ({ dimension }: { dimension: number }) => {

  const [playerName, setPlayerName] = useState("");
  const [squares, setSquares] = useState<SquaresMap>(() => buildSquaresMap(dimension));
  const [drawHistory, setDrawHistory] = useState(new Set<number>());

  const resetGame = () => {
    setSquares(buildSquaresMap(dimension));
    setDrawHistory(new Set());
  }

  const draw = () => {
    // Get available squares
    // Could be stored in state, alternatively the array of possible numbers could be there.
    // Alternative solution eg. to loop 
    const availableRange = Array
      .from({length: dimension * dimension * 3}, (_, i) => i + 1)
      .filter(entry => !drawHistory.has(entry));

    if (!availableRange.length) {
      return;
    }

    // Randomly pick one
    const randomNumberWithinAvailableRange = availableRange[Math.floor(Math.random() * availableRange.length)];
    
    // Copy drawHistory state
    const tmpDrawHistory: Set<number> = new Set(drawHistory);
    tmpDrawHistory.add(randomNumberWithinAvailableRange);
    
    setDrawHistory(tmpDrawHistory);


    // Try to see if this square is on our board
    const randomSquare = squares.get(randomNumberWithinAvailableRange);

    if (randomSquare) {
      // Copy squares state
      let tmpSquares: SquaresMap = new Map(squares);
    
      // Mark random square drawn
      tmpSquares.set(randomSquare.value, {...randomSquare, drawn: true});
      tmpSquares = checkForBingo(tmpSquares);

      setSquares(tmpSquares);
    }
  }

  const checkForBingo = (accumulatorSquares: SquaresMap) => {

    const allSquaresArray = Array.from(accumulatorSquares.values());

    // Check rows and columns
    for (let i = 0; i < dimension; i++) {
      [ allSquaresArray.filter(squareData => (squareData.drawn && squareData.row == i)),
        allSquaresArray.filter(squareData => (squareData.drawn && squareData.col == i))
      ].forEach(squaresToCheck => {
        accumulatorSquares = checkAndUpdateBingoState(
          accumulatorSquares, squaresToCheck
        );
      });
    }

    // For topLeft-bottomRight diagonal, row == col
    // For bottomLeft-topRight diagonal, row + col == dimension - 1
    [ allSquaresArray.filter(squareData => (squareData.drawn && squareData.row == squareData.col)),
      allSquaresArray.filter(squareData => (squareData.drawn && squareData.row + squareData.col == dimension - 1))
    ].forEach(squaresToCheck => {
      accumulatorSquares = checkAndUpdateBingoState(
        accumulatorSquares, squaresToCheck
      );
    });

    return accumulatorSquares;
  }

  const checkAndUpdateBingoState = (accumulator: SquaresMap, squaresToCheck: Square[]) => {
    if (squaresToCheck.length >= dimension) { // Should never be >, but you never know :)
      squaresToCheck.forEach(squareData => {
        accumulator.set(squareData.value, {...squareData, inBingo: true});
      })
    }

    return accumulator;
  }

  return (
    <div className="App">

      <div className="drawnNumbersContainer">
        { Array.from(drawHistory).map(square => (
          <span
            key={square}
            className={classNames({
              "found": squares.has(square)
            })}
          >{square}</span>  
        ))}
      </div>
      
      <div className="playerNameContainer">
        { !playerName && <span>Your name: </span> }
        <div className="playerName" contentEditable={true}
          onBlur={e => setPlayerName(e.currentTarget.textContent ?? "")}></div>
        <button onClick={draw}>Draw</button>
      </div>

      <div className="bingo" style={{
        gridTemplateColumns: `repeat(${dimension}, minmax(50px, 100px))`,
        gridTemplateRows: `repeat(${dimension}, 1fr)`
      }}>
        { Array.from(squares.values()).map(squareData =>
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

      <button className="playAgain" onClick={resetGame}>Reset and play again</button>
    
    </div>
  );
}

export default App;
