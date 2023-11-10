import { useContext } from "react";
import { AppActions, AppContext } from "../../hooks/AppContext";
import { truncateString } from "../../utils/string";
import { toast } from "react-toastify";

export const UtxoCard = () => {
  const [appState, dispatch] = useContext(AppContext);
  const { totalUtxoValue, selectedUtxo, listUtxo } = appState;

  const handleOnChange = (index: number) => {
    dispatch({
      type: AppActions.SelectUtxo,
      payload: index,
    });
  };

  return (
    <>
      <b>UTXO</b>
      <br />
      {listUtxo.map((utxo, index) => {
        return (
          <div key={index}>
            <div>
              <input
                type="checkbox"
                name={utxo.txid}
                value={index}
                checked={selectedUtxo
                  .map((v) => `${v.txid}-${v.vout}`)
                  .includes(`${utxo.txid}-${utxo.vout}`)}
                onChange={() => handleOnChange(index)}
              />
              <label
                onClick={() => {
                  navigator.clipboard.writeText(utxo.account.address);
                  toast.success("Copy address success");
                }}
              >
                {truncateString(utxo.account.address, 20)}
              </label>
            </div>
            <div className="right-section">{utxo.value} sat</div>
          </div>
        );
      })}
      <div>
        <p>Total: {totalUtxoValue} sat</p>
      </div>
    </>
  );
};
