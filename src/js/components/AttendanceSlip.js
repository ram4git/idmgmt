import React from 'react';
import InputForm from './InputForm';
import { getEmployees, getEmployee } from '../api/employees';
import { attendanceDatesLoop,
  getEmployeeAttendanceDates,
  saveEmailReport,
  savePrintCopiesData,
  fetchPrintCopiesData } from '../api/attendance';
import { getVillages } from '../api/configuration';
import Select from 'grommet/components/Select';
import DateTime from 'grommet/components/DateTime';
import moment from 'moment';
import * as firebase from 'firebase';
import Table from 'grommet/components/Table';
import TableRow from 'grommet/components/TableRow';
import { getMessage } from 'grommet/utils/Intl';
import Notification from 'grommet/components/Notification';
import PrintIcon from 'grommet/components/icons/base/Print';
import BookIcon from 'grommet/components/icons/base/Book';
import Button from 'grommet/components/Button';
import { Print } from 'react-easy-print';
import { RingLoader } from 'react-spinners';
import Barcode from 'react-barcode';
import AttendanceSlipPrint from './AttendanceSlipPrint';
import ReactToPrint from "react-to-print";
const uniqid = require('uniqid');


class AttendanceSlip extends React.Component {

constructor(props) {
  super(props);
  this.state = {
    validationMsg:'',
    startDate : '',
    endDate: '',
    unit: '',
    paymentType: '',
    shift: '',
    loading: false,
    refreshData: false
  }
}

componentDidMount() {
  this.getEmployees();
}


getEmployees() {
  getEmployees()
    .then((snap) => {
      const data = snap.val();
      if (!data) {
        return;
      }
      this.setState({
        allEmployees : data
      });
    })
    .catch((err) => {
      console.error('VISITOR FETCH FAILED', err);
    });
}

  renderActivityIndicator() {
    const { loading } = this.state;
      return (

        <div style={{display: 'flex', justifyContent: 'center', marginTop:10}}>
        <RingLoader
              sizeUnit={"px"}
              size={100}
              color={'#865CD6'}
              loading={this.state.loading}
            />
        </div>
      )
  }


  renderValidationMsg() {
    const { validationMsg } = this.state;
    if (validationMsg) {
      return (
        <Notification message={validationMsg} size='small' status='critical' />
      );
    }
    return null;
  }

  onValidatingInputs() {
    const { startDate, endDate, unit } = this.state;
    if(!unit) {
      this.setState({
        validationMsg: 'UNIT is Missing'
      })
      return
    }

    if(!startDate) {
      this.setState({
        validationMsg: 'From Date is Missing'
      })
      return
    }

    if(!endDate) {
      this.setState({
        validationMsg: 'To Date is Missing'
      })
      return
    }

    this.setState({
      validationMsg:'',
      loading: true
    }, this.attendanceDatesLoop.bind(this))
  }

  attendanceDatesLoop() {
    const { startDate, endDate, unit, allEmployees } = this.state;

    let datesArr=[];
    let startDateParts = startDate.split("-");
    let endDateParts = endDate.split("-");
    let startDateObj = new Date(startDateParts[2], startDateParts[1]-1, startDateParts[0]);
    let endDateObj = new Date(endDateParts[2], endDateParts[1]-1, endDateParts[0]);

    while (startDateObj <= endDateObj) {
    datesArr.push(moment(startDateObj).format('DD-MM-YYYY'));
    startDateObj.setDate(startDateObj.getDate() + 1);
    }

    let returnObj = {};
    let unitVal;
    if(unit == 'UNIT2') {
      unitVal= ''
    } else {
      unitVal = unit;
    }
    const dbRef = firebase.database().ref(`${unitVal}/attendance/`);
    Promise.all(
      datesArr.map((date) => {
        return dbRef.child('dates').child(date).once('value').then((snapshot) => {
          let response = snapshot.val();
          returnObj[date] = response;
        })
      })
    ).then(() => {
      let employeeVsDate = {};
      Object.keys(returnObj).map((date,index) => {
            let attObj = returnObj[date];
            if(attObj) {
            Object.keys(attObj).map((empId, k) => {
              let existingData  = employeeVsDate[empId] || [];
              let newData = {
                date : date,
                value : attObj[empId]
              }
              existingData.push(newData);
              employeeVsDate[empId] = existingData;
            })
          } else {
            this.setState({
              noDataMsg : 'No Data Existed',
              loading: false
            })
          }
        });
        this.setState({
            response: returnObj,
            employeeVsDate,
            loading: false
          });
    })

  }

  getTablesArray(isPrint) {
    const { response,
            startDate,
            endDate,
            paymentType,
            shift,
            gender,
            village,
            shiftSelected,
            paymentTypeSelected,
            genderSelected,
            villageSelected,
            employeeVsDate,
            allEmployees,
            employeeSelected,
            selectedEmployeeId, unit, printCopies } = this.state;

    if(!response)
    return null;

    let tablesArray = [];
    let reportData = [];
    let returnObj = {};
    let idVsName = [];
    Object.keys(employeeVsDate).map((empId) => {
      let empName =  allEmployees[empId]['name'] || "";
      idVsName.push({'id' : empId,
              'name' : empName
            });
    })


    idVsName.sort((a,b) => {
      let A = a.name || "";
      let B = b.name || "";
      if(A < B)
          return -1;
      else if (A > B)
          return 1;
      else {
          return 0;
      }
    })

    let dailyMaleDayShift = 0;
    let dailyMaleNightShift = 0;
    let dailyFemaleDayShift = 0;
    let dailyFemaleNightShift = 0;
    let weeklyMaleDayShift = 0;
    let weeklyMaleNightShift = 0;
    let weeklyFemaleDayShift = 0;
    let weeklyFemaleNightShift = 0;
    let jattuPayment = 0;
    let iterator = 0;


    idVsName.map((idNameObj, index) => {
      let employeeId = idNameObj['id'];

      const attendanceObjArray = employeeVsDate[employeeId];
      let empAttObj = allEmployees[employeeId];
      if(attendanceObjArray ==null)
        return;
        let i = 0;


        let isValid = true;



      let uniqId = uniqid();
      let totalNumberOfdays = 0;
      attendanceObjArray.map((dateObject,index)=> {
        const employeeAttendaceObj = dateObject['value'];
        if(employeeAttendaceObj !== null){
        let inTime = employeeAttendaceObj.in;
        let outTime = employeeAttendaceObj.shift == 'Night Shift' ? employeeAttendaceObj.tomorrowsOutTime : employeeAttendaceObj.out;
        if(inTime && outTime)
         totalNumberOfdays++;
      }

          if(paymentTypeSelected && paymentType !== empAttObj.paymentType) {
            isValid = false;
          }

          if(shiftSelected && shift !== employeeAttendaceObj.shift) {
            isValid = false;
          }

          if(genderSelected && gender !== allEmployees[employeeId]['gender'] ) {
            isValid = false;
          }

          if(villageSelected && village !== allEmployees[employeeId]['village'] ) {
            isValid = false;
          }

          if(employeeSelected && selectedEmployeeId !== employeeId ) {
            isValid = false;
          }

          if(empAttObj.paymentType === 'Daily payment' && empAttObj.gender === 'Male' && employeeAttendaceObj.shift === 'Day Shift') {
            dailyMaleDayShift += 1
         }

         if(empAttObj.paymentType === 'Daily payment' && empAttObj.gender === 'Male' && employeeAttendaceObj.shift === 'Night Shift') {
           dailyMaleNightShift += 1
        }

        if(empAttObj.paymentType === 'Daily payment' && empAttObj.gender === 'Female' && employeeAttendaceObj.shift === 'Day Shift') {
          dailyFemaleDayShift += 1
       }

       if(empAttObj.paymentType === 'Daily payment' && empAttObj.gender === 'Female' && employeeAttendaceObj.shift === 'Night Shift') {
         dailyFemaleNightShift += 1
      }

        if(empAttObj.paymentType === 'Weekly payment' && empAttObj.gender === 'Male' && employeeAttendaceObj.shift === 'Day Shift') {
          weeklyMaleDayShift += 1
       }
       if(empAttObj.paymentType === 'Weekly payment' && empAttObj.gender === 'Male' && employeeAttendaceObj.shift === 'Night Shift') {
         weeklyMaleNightShift += 1
      }
      if(empAttObj.paymentType === 'Weekly payment' && empAttObj.gender === 'Female' && employeeAttendaceObj.shift === 'Day Shift') {
        weeklyFemaleDayShift += 1
     }
     if(empAttObj.paymentType === 'Weekly payment' && empAttObj.gender === 'Female' && employeeAttendaceObj.shift === 'Night Shift') {
       weeklyFemaleNightShift += 1
    }
    if(empAttObj.paymentType === 'Jattu-Daily payment') {
      jattuPayment += 1
    }

      });

      if(!isValid) {
        return
      }

      let top = iterator * 15.556;
      let topStr = top + 'in'
      iterator++;


      let  now = new Date();
      const timestampStr = moment(now).format('DD/MM/YYYY hh:mm:ss A');

      tablesArray.push(<div className="attendanceTableArr" key={uniqId}>
      <h2 style={!isPrint ? {display:'none'} : {textAlign: 'center',marginTop: 60}}>Attendance Slip From : <strong>{startDate}</strong> To: <strong>{endDate}</strong><span style={isPrint ? { position: 'absolute', right: 80, visibility: 'visible'} : { visibility: 'hidden' }}>{iterator}</span></h2>
      <h4 style={isPrint ? {marginLeft: 40} : {display: 'none'}}>Unit: {unit}<span style={{position: 'absolute', right : 80}}>Copy:<strong>{printCopies ? 'Duplicate ' + '# '+printCopies : 'Original'}</strong></span></h4>
      <h4 style={!isPrint ? {display:'none'} : {marginLeft : 20}}><Barcode value={employeeId} height={20}/><span style={{position: 'absolute', right : 80}}>Date : {timestampStr}</span></h4>
      <h3 style={{marginLeft : 20}}>{allEmployees[employeeId]['name']} ; {employeeId} ; {allEmployees[employeeId]['village']}<span style={isPrint ? {position: 'absolute', right : 80}: {marginLeft : 80}}>No of days = <strong>{totalNumberOfdays}</strong></span></h3>
      <Table scrollable={true} style={isPrint ? {} :  { marginTop : '10px', marginLeft : '30px'}}>
          <thead style={{position:'relative'}}>
           <tr>
             <th>S.No</th>
             <th>Date</th>
             <th>Shift</th>
             <th>In Time</th>
             <th>Out Time</th>
             <th>Total Time Spent</th>
           </tr>
          </thead>
          <tbody>
            {

                attendanceObjArray.map((dateObject,index)=> {
                  let totalNumberOfdays = 0;
                  const dateVal = dateObject['date']
                  const employeeAttendaceObj = dateObject['value'];
                  if(employeeAttendaceObj !== null){
                  let inTime = employeeAttendaceObj.in;
                  let outTime = employeeAttendaceObj.shift == 'Night Shift' ? employeeAttendaceObj.tomorrowsOutTime : employeeAttendaceObj.out;
                  let totalTime = 'N/A';


                if(outTime && inTime) {
                  totalNumberOfdays++;
                  let startTime = moment(inTime, "HH:mm a");
                  let endTime=moment(outTime, "HH:mm a");
                  let duration = moment.duration(endTime.diff(startTime));

                  let hours = 0, minutes =0;
                  if(duration.asMilliseconds() < 0) {
                   let dMillis = duration.asMilliseconds();
                   let bufferedMillis = dMillis + (24 * 60 * 60 * 1000);
                   let bufferedSeconds = bufferedMillis / 1000;
                    hours = Math.floor(bufferedSeconds / 3600);
                   let remainingSeconds = bufferedSeconds % 3600 ;
                    minutes = remainingSeconds / 60;
                   }else {
                    hours = parseInt(duration.asHours());
                    minutes = parseInt(duration.asMinutes())%60;
                   }

                   totalTime = hours + ' hr ' + minutes + ' min '
                }

                let istInTime =  moment.utc(inTime).local().format('YYYY-MM-DD HH:mm:ss');
                let istOutTime =  '--'
                if(outTime !== 'N/A')
                  istOutTime=moment.utc(outTime).local().format('YYYY-MM-DD HH:mm:ss');


                   i++;
                     reportData.push( {
                     serialNo : i,
                     manpowerId : employeeId,
                     name :  employeeAttendaceObj.name,
                     numberOfPersons : employeeAttendaceObj.numberOfPersons,
                     shift : employeeAttendaceObj.shift,
                     inTime : inTime,
                     outTime : outTime,
                     totalTime : totalTime
                   });

                     return <TableRow key={index} className="attTableRow" style={employeeAttendaceObj.paymentType == 'Daily payment' ?
                     {backgroundColor : '#C6D2E3'} : employeeAttendaceObj.paymentType == 'Jattu-Daily payment' ?
                     {backgroundColor: '#eeeeee'}: employeeAttendaceObj.paymentType == 'Weekly payment' ?
                     {backgroundColor: '#9E9E9E'}: {backgroundColor: 'white'}}>
                     <td>{i}</td>
                     <td>{dateVal}</td>
                     <td>{employeeAttendaceObj.shift}</td>
                     <td>{employeeAttendaceObj.in}</td>
                     <td>{outTime}</td>
                     <td>{totalTime}</td>
                     </TableRow>
                   }
            })
          }
        </tbody>
      </Table>
      </div>)
    })
    returnObj['tablesArray'] = tablesArray;
    returnObj['reportData'] = reportData;
    returnObj['summary'] = {
      dailyMaleDayShift,
      dailyMaleNightShift,
      dailyFemaleDayShift,
      dailyFemaleNightShift,
      weeklyMaleDayShift,
      weeklyMaleNightShift,
      weeklyFemaleDayShift,
      weeklyFemaleNightShift,
      jattuPayment
    };
    return returnObj;
  }

  renderNoDataText() {
    return (
      <h1 style={{marginTop:40, marginLeft: 400}}>No data Existed!</h1>
    )
  }

  showEmployeeReportsTable() {
    const { response,
            startDate,
            endDate,
            paymentType,
            shift,
            shiftSelected,
            paymentTypeSelected, employeeVsDate, allEmployees } = this.state;

    let tablesObj = this.getTablesArray(false);

    if(!tablesObj)
    return null;
    let ob = [{
      start : startDate,
      end : endDate
    }]
    return (

      <div className='table' style={{marginTop: 40}}>
      {
        tablesObj['tablesArray'].length == 0 ? null :
        <div>
        <div>
          <h3 style={{marginLeft: 20,marginBottom: 20, color: '#865CD6'}}>Number of Manpower : { tablesObj['tablesArray'].length }</h3>
        </div>
        <div style={{float : 'right'}}>
          <ReactToPrint
              trigger={this.renderTrigger.bind(this)}
              content={this.renderContent.bind(this)}
              onBeforePrint={this.handleBeforePrint.bind(this)}
              onAfterPrint={this.handleAfterPrint.bind(this)}
            />
          </div>
        </div>
      }
      <div style={{marginTop : 20}}>
      {tablesObj['tablesArray'].length == 0 ? this.renderNoDataText() : tablesObj['tablesArray']}
      </div>
      </div>
    )

  }

  renderContent() {
    return this.componentRef;
  }

  renderTrigger() {
    return (
      <Button icon={<PrintIcon />} label='Print' fill={true}
      primary={true} style={{marginRight: '13px'}}
      href='#'/>
    )
  }

  handleBeforePrint() {
    this.attendancePrintTableData();
  }

  handleAfterPrint() {
    this.setState({
      response: null,
      refreshData: true
    })
  }

  attendancePrintTableData() {
    const { dateRange, printCopies, employeePrintCopies, employeeSelected, selectedEmployeeId, startDate, endDate, unit } = this.state;
    let key =  startDate + '_' + endDate  + '_'+ unit;
    let copies = printCopies;

    if(employeeSelected) {
      key = key + '_' + selectedEmployeeId;
      copies = employeePrintCopies;
    }
    savePrintCopiesData(key, copies, unit);
  }


  onUnitSelected(unit) {
    this.setState({
      unit,
      response: null,
      validationMsg: ''
    })
  }

  onStartDateSelected(startDate) {
    this.setState({
      startDate,
      response : null,
      validationMsg: '',
    })
  }

  getPrintCopiesData() {
    const { dateRange, unit } = this.state;
    fetchPrintCopiesData(dateRange + '_' + unit).then((snap) => {
      let printCopies = snap.val();
      this.setState({printCopies})
    }).catch((err) => console.log(err))
  }

  onEndDateSelected(endDate, dateRange) {
    this.setState({
      endDate,
      dateRange,
      response: null,
      validationMsg: ''
    }, this.getPrintCopiesData.bind(this))
  }

  onPaymentSelected(paymentType) {
    if(paymentType == '-EMPTY-') {
      this.setState({
        paymentType,
        paymentTypeSelected: false
      })
    } else {
      this.setState({
        paymentType,
        paymentTypeSelected: true
      })
    }
  }

  onShiftSelected(shift) {
    if(shift == '-EMPTY-') {
      this.setState({
        shift,
        shiftSelected: false
      })
    } else {
      this.setState({
        shift,
        shiftSelected: true
      })
    }
  }

  onGenderSelected(gender) {
    if(gender == '-EMPTY-') {
      this.setState({
        gender,
        genderSelected: false
      })
    } else {
      this.setState({
        gender,
        genderSelected: true
      })
    }
  }

  onVillageSelected(village) {

    if(village == '-EMPTY-') {
      this.setState({
        village,
        villageSelected: false
      })
    } else {
      this.setState({
        village,
        villageSelected: true
      })
    }
  }

  getEmployeePrintCopiesData() {
    const { startDate, endDate, selectedEmployeeId, unit } = this.state;
    if(startDate && endDate && selectedEmployeeId) {
      let dateEmployeeKey = startDate + '_' + endDate + '_' + unit + '_' +  selectedEmployeeId;
       fetchPrintCopiesData(dateEmployeeKey).then((snap) => {
        let employeePrintCopies = snap.val();
        this.setState({employeePrintCopies})
      }).catch((err) => console.log(err))
    }
  }

  onEmployeeSelected(employeeSelected, selectedEmployeeId, selectedEmployeeData) {
    console.log(employeeSelected, selectedEmployeeId, selectedEmployeeData);
    this.setState({
      employeeSelected,
      selectedEmployeeId,
      selectedEmployeeData
    }, this.getEmployeePrintCopiesData.bind(this))
  }

  renderInputForm() {
    return (
      <InputForm
        refreshData={this.state.refreshData}
        onUnitSelected={this.onUnitSelected.bind(this)}
        onStartDateSelected={this.onStartDateSelected.bind(this)}
        onEndDateSelected={this.onEndDateSelected.bind(this)}
        onPaymentSelected={this.onPaymentSelected.bind(this)}
        onShiftSelected={this.onShiftSelected.bind(this)}
        onGenderSelected={this.onGenderSelected.bind(this)}
        onVillageSelected={this.onVillageSelected.bind(this)}
        onEmployeeSelected={this.onEmployeeSelected.bind(this)}
        onShowReport={this.onValidatingInputs.bind(this)}
        showAbstractButton={false}
      />
    )
  }

  setPrintRef(ref) {
    this.componentRef = ref;
  }

  renderNewPrintCard() {
    let tablesObj = this.getTablesArray(true);
    if(!tablesObj)
    return null;

    let attendanceSlipArr = tablesObj['tablesArray'];
    return (
      <div>
          <AttendanceSlipPrint
            ref={this.setPrintRef.bind(this)}
            attendanceSlipArr={attendanceSlipArr}
          />
      </div>
    )
  }

  render() {
    return (
      <div>
      { this.renderValidationMsg() }
      { this.renderInputForm() }
      { this.renderActivityIndicator() }
      { this.showEmployeeReportsTable() }
      { this.renderNewPrintCard() }
      </div>
    )
  }
}
export default AttendanceSlip