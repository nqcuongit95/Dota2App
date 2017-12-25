import React, { Component } from "react";
import {
  View,
  Text,
  Title,
  Image,
  TouchableOpacity,
  Divider,
  ScrollView
} from "@shoutem/ui";

import { FlatList } from "react-native";
import Loading from "../components/Loading";
import RecordRow from "../components/RecordRow";
import Pagination from "../components/Pagination";
import Header from "../components/Header";

import { bindActionCreators } from "redux";
import { createGroupedArray, processRecord } from "../utils/utilsFunction";
import themeColors from "../themes/colors";
import { connectStyle } from "@shoutem/theme";
import { connect } from "react-redux";
import { getGetOrdinal } from "../utils/utilsFunction";
import { testFetchXPMRecord } from "../actions/XPMRecordAction";
import { RECORD_ROW_HEIGHT } from "../components/RecordRow";

import moment from "moment";

class XPMRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {
      xpmRecords: [],
      refreshing: false,
      currentPageIndex: 0
    };

    this.renderItem = this.renderItem.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
    this.onPage = this.onPage.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.renderHeader = this.renderHeader.bind(this);
    this.keyExtractor = this.keyExtractor.bind(this);
  }

  componentWillMount() {}

  componentWillReceiveProps(nextProps) {
    if (this.props != nextProps && nextProps.xpmRecords.length > 0) {
      const records = processRecord(nextProps.xpmRecords);
      this.setState({ xpmRecords: createGroupedArray(records, 20) });
    }
  }

  componentDidMount() {
    this.props.actions.testFetchXPMRecord();
  }

  onPage(index) {
    this.setState({ currentPageIndex: index });
  }

  renderItem({ item, index }) {
    return <RecordRow record={item} index={index} />;
  }

  getItemLayout(data, index) {
    return {
      offset: RECORD_ROW_HEIGHT * index,
      length: RECORD_ROW_HEIGHT,
      index
    };
  }

  onRefresh() {
    this.setState({
      refreshing: true
    });
  }

  keyExtractor(item, index) {
    return item.matchId;
  }

  renderFooter() {
    const { currentPageIndex, xpmRecords } = this.state;
    const totalPages = xpmRecords.length;

    return (
      <Pagination
        totalPages={totalPages}
        currentIndex={currentPageIndex}
        numberPagesShow={5}
        onPage={this.onPage}
      />
    );
  }

  renderHeader() {
    const styles = this.props.style;

    return <Header headers={["RANK", "XPM", "ID", ""]} />;
  }

  render() {
    const { isLoadingXPMRecord } = this.props;
    const { xpmRecords, currentPageIndex } = this.state;
    const styles = this.props.style;
    let content = <View />;

    if (isLoadingXPMRecord) {
      content = <Loading />;
    } else if (xpmRecords.length > 0) {
      content = (
        <FlatList
          data={xpmRecords[currentPageIndex]}
          renderItem={this.renderItem}
          getItemLayout={this.getItemLayout}
          //refreshing={this.state.refreshing}
          //onRefresh={this.onRefresh}
          ListHeaderComponent={this.renderHeader}
          ListFooterComponent={this.renderFooter}
          keyExtractor={this.keyExtractor}
          initialNumToRender={10}
        />
      );
    }

    return (
      <View styleName="fill-parent dota2" style={styles.container}>
        {content}
      </View>
    );
  }
}

XPMRecord.navigationOptions = {
  title: "XPM Records",
  tabBarLabel: "XPM"
};

const styles = {
  container: {
    paddingBottom: 10,
    paddingTop: 10,
    paddingLeft: 15,
    paddingRight: 15
  }
};

function mapStateToProps(state) {
  return {
    isLoadingXPMRecord: state.xpmRecordState.isLoadingXPMRecord,
    isEmptyXPMRecord: state.xpmRecordState.isEmptyXPMRecord,
    xpmRecords: state.xpmRecordState.xpmRecords
  };
}

function mapDispatchToprops(dispatch) {
  return {
    actions: bindActionCreators({ testFetchXPMRecord }, dispatch)
  };
}

export default connectStyle("dota2app.XPMRecord", styles)(
  connect(mapStateToProps, mapDispatchToprops)(XPMRecord)
);
