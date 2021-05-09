import React, { Component } from 'react';
import axios from 'axios'
import { FaCheck, FaTrashAlt, FaTimes, FaUndo} from "react-icons/fa";

const Request = props => (
    <tr>
      <td>{props.currentRequest.userId}</td>
      <td>{props.currentRequest.username}</td>
      <td>{props.currentRequest.dateApplied}</td>
      <td>{props.currentRequest.reason}</td>
      <td>{props.currentRequest.status}</td>
      <td>
            <button type="button" className="btn btn-primary" onClick={() => props.updateRequest(props.currentRequest.uuid, "Approved", props.currentRequest.userId, props.currentRequest.dateApplied)}><FaCheck/></button>
            <button type="button" className="btn btn-success" onClick={() => props.updateRequest(props.currentRequest.uuid, "Rejected", props.currentRequest.userId, props.currentRequest.dateApplied)}><FaTimes/></button>
            <button type="button" className="btn btn-danger"onClick={() => props.deleteRequest(props.currentRequest.uuid)}><FaTrashAlt/></button>
      </td>
    </tr>
  )

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.deleteRequest = this.deleteRequest.bind(this)
        this.updateRequest = this.updateRequest.bind(this)
        this.refreshPage = this.refreshPage.bind(this)
        this.state = {
          requests: [],
          alert: false, 
          alertMessage: ""
        };
    } 

    componentDidMount() {
        // const tokenString = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MjA1Njc1ODB9.4LS_s_FphPH1OviiYmGqmwvs-f8GO0qIklFetOQQ0yU"
      this.fetchData()
    }

    fetchData() {
      axios.get('http://localhost:3306/api/allRequests', { headers: {"Authorization" : `Bearer ${process.env.REACT_APP_ACCESS_TOKEN}`} })
      .then(response => {
          console.log(response)
          this.setState({ requests: response.data})
      })
      .catch((error) => {
          console.log(error);
      })
    }

    deleteRequest(uuid) {
      axios.delete('http://localhost:3306/api/deleteRequest/' + uuid, { headers: {"Authorization" : `Bearer ${process.env.REACT_APP_ACCESS_TOKEN}`} })
      .then(response => { console.log(response.data)});

      this.setState({
        alert: true, 
        alertMessage: `Request ${uuid} is deleted`,
        requests: this.state.requests.filter(el => el.uuid !== uuid)
      })

      this.timer = setInterval(() => {this.setState({alert: false})}, 5000)
    }

    updateRequest(uuid, status, userId, dateApplied) {
      const data = {
        uuid: uuid, 
        status: status
      }
      axios.post('http://localhost:3306/api/updateStatus', data, { headers: {"Authorization" : `Bearer ${process.env.REACT_APP_ACCESS_TOKEN}`} })
      .then(response  => {
        if (response && status==="Approved") {
          this.updateCount(dateApplied)
        }
        this.sendUpdateNotification(userId, dateApplied, status)
      })

      const objIndex = this.state.requests.findIndex((obj => obj.uuid === uuid));
      let tempRequests = [...this.state.requests]
      tempRequests[objIndex].status = status

      this.setState({
        alert: true, 
        alertMessage: `Request ${uuid} has been updated to ${status}`,
        requests: tempRequests
      })

      this.timer = setInterval(() => {this.setState({alert: false})}, 5000)
    }

    updateCount(dateApplied) {
      const data = {
        "date": dateApplied
      }
      axios
        .post(
          `http://localhost:3306/api/reduceCount`,
          data, { headers: {"Authorization" : `Bearer ${process.env.REACT_APP_ACCESS_TOKEN}`} }
        ).then(response => {
          console.log(response.data)
        })
      }

    sendUpdateNotification(userId, dateApplied, status) {
      const data = {
        chat_id: userId,
        text: `Your request for ${dateApplied} has been ${status.toLowerCase()}.`
      }
      axios
        .post(
          `https://api.telegram.org/${process.env.REACT_APP_BOT_TOKEN}/sendMessage`,
          data, { headers: {"Authorization" : `Bearer ${process.env.REACT_APP_ACCESS_TOKEN}`} }
        ).then(response => {
          console.log(response.data)
        })
    }

    requestsList() {
        return this.state.requests.map(currentRequest => {
            return <Request currentRequest={currentRequest} deleteRequest={this.deleteRequest} updateRequest={this.updateRequest} key={currentRequest.uuid}/>;
        })
    }

    refreshPage() {
      this.fetchData()
    }

    render() {
      let alertNotification
        if (this.state.alert) {
          alertNotification = <div className="alert alert-primary" role="alert">
                          {this.state.alertMessage}
                          </div>
        }
        return(
            <div>
            {alertNotification}
            <div className="d-flex justify-content-between">
              <h3>All Requests</h3>
              <button type="button" className="btn btn-dark" onClick={()=>this.refreshPage()} ><FaUndo/></button>
            </div>
            <br></br>
            <table className="table table-bordered">
              <thead className="thead-light">
                <tr>
                  <th className="col-md-1">User ID</th>
                  <th className="col-md-1">Name</th>
                  <th className="col-md-2">Date Applied</th>
                  <th className="col-md-5">Reason</th>
                  <th className="col-md-1">Status</th>
                  <th className="col-md-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                { this.requestsList() }
              </tbody>
            </table>
          </div>
        ) 
    }
}