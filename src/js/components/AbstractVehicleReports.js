import React from 'react';

class AbstractVehicleReports extends React.Component {
  constructor(props) {
    super(props);
    this.state={};
  }

  renderAbstractReport() {
    const {response, selectedDate}=this.props;
    let returnObj={};
    let inwardOwnEmpty=0;
    let inwardOwnLoad=0;
    let inwardOutEmpty=0;
    let inwardOutLoad=0;
    let outwardOwnEmpty=0;
    let outwardOwnLoad=0;
    let outwardOutEmpty=0;
    let outwardOutLoad=0;

    Object.keys(response).map((vNo, index) => {
      const sNoObj = response[vNo];
      Object.keys(sNoObj).map(sNo => {
        let vObj=sNoObj[sNo];
              if(vObj.inSide && vObj.ownOutVehicle === 'Own Vehicle' && vObj.emptyLoad === 'Empty') {
                inwardOwnEmpty += 1;
              }
              if(vObj.inSide && vObj.ownOutVehicle === 'Own Vehicle' && vObj.emptyLoad === 'Load') {
                inwardOwnLoad += 1;
              }
              if(vObj.inSide && vObj.ownOutVehicle === 'Outside Vehicle' && vObj.emptyLoad === 'Empty') {
                inwardOutEmpty += 1;
              }
              if(vObj.inSide && vObj.ownOutVehicle === 'Outside Vehicle' && vObj.emptyLoad === 'Load') {
                inwardOutLoad += 1;
              }
              if(!vObj.inSide && vObj.ownOutVehicle === 'Own Vehicle' && vObj.emptyLoad === 'Empty') {
                outwardOwnEmpty += 1;
              }
              if(!vObj.inSide && vObj.ownOutVehicle === 'Own Vehicle' && vObj.emptyLoad === 'Load') {
                outwardOwnLoad += 1;
              }
              if(!vObj.inSide && vObj.ownOutVehicle === 'Outside Vehicle' && vObj.emptyLoad === 'Empty') {
                outwardOutEmpty += 1;
              }
              if(!vObj.inSide && vObj.ownOutVehicle === 'Outside Vehicle' && vObj.emptyLoad === 'Load') {
                outwardOutLoad += 1;
              }
            })
    })

    returnObj['summary'] = {
      inwardOwnEmpty,
      inwardOwnLoad,
      inwardOutEmpty,
      inwardOutLoad,
      outwardOwnEmpty,
      outwardOwnLoad,
      outwardOutEmpty,
      outwardOutLoad
    }
    return returnObj;
  }

  render() {
    const {selectedDate}=this.props;
    const abstractReportObj=this.renderAbstractReport();
    let objSummary=abstractReportObj['summary'];

    let inwardOwnEmpty=objSummary.inwardOwnEmpty;
    let inwardOwnLoad=objSummary.inwardOwnLoad;
    let inwardOutEmpty=objSummary.inwardOutEmpty;
    let inwardOutLoad=objSummary.inwardOutLoad;
    let outwardOwnEmpty=objSummary.outwardOwnEmpty;
    let outwardOwnLoad=objSummary.outwardOwnLoad;
    let outwardOutEmpty=objSummary.outwardOutEmpty;
    let outwardOutLoad=objSummary.outwardOutLoad;

    let inwardOwnTotal=inwardOwnEmpty+inwardOwnLoad;
    let inwardOutTotal=inwardOutEmpty+inwardOutLoad;
    let inwardTotal=inwardOwnTotal+inwardOutTotal;
    let outwardOwnTotal=outwardOwnEmpty+outwardOwnLoad;
    let outwardOutTotal=outwardOutEmpty+outwardOutLoad;
    let outwardTotal=outwardOwnTotal+outwardOutTotal;

    return (
      <div>
        <h2 style={{textAlign: 'center'}}><strong>Abstract vehicle report {selectedDate}</strong></h2>
        <table className="vehicleReportsTable" style={{ marginLeft : 20, marginTop:10}}>
          <thead className="vehiclesTableHead" style={{position: 'relative', backgroundColor: '#F5F5F5'}}>
           <tr>
             <th colSpan={1}></th>
             <th colSpan={3}>Own Vehicle</th>
             <th colSpan={3}>Out Vehicle</th>
             <th></th>
           </tr>
           <tr>
             <th></th>
             <th>Empty</th>
             <th>Load</th>
             <th>Total</th>
             <th>Empty</th>
             <th>Load</th>
             <th>Total</th>
             <th>Grand Total</th>
           </tr>
          </thead>
          <tbody>
              <tr>
                <th>Inward</th>
                <th style={{backgroundColor: '#9E9E9E'}}>{inwardOwnEmpty}</th>
                <th style={{backgroundColor: '#9E9E9E'}}>{inwardOwnLoad}</th>
                <th style={{backgroundColor: '#9E9E9E'}}>{inwardOwnTotal}</th>
                <th>{inwardOutEmpty}</th>
                <th>{inwardOutLoad}</th>
                <th>{inwardOutTotal}</th>
                <th>{inwardTotal}</th>
              </tr>
              <tr>
                <th>Outward</th>
                <th style={{backgroundColor: '#9E9E9E'}}>{outwardOwnEmpty}</th>
                <th style={{backgroundColor: '#9E9E9E'}}>{outwardOwnLoad}</th>
                <th style={{backgroundColor: '#9E9E9E'}}>{outwardOwnTotal}</th>
                <th>{outwardOutEmpty}</th>
                <th>{outwardOutLoad}</th>
                <th>{outwardOutTotal}</th>
                <th>{outwardTotal}</th>
              </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

export default AbstractVehicleReports;
