<%--
  Created by IntelliJ IDEA.
  denglu.User: huchi
  Date: 2022/11/15
  Time: 18:58
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>

<head>
    <title>
    </title>
</head>
<body>
<jsp:useBean id="stu" class="denglu.User" scope="application"/>
<%
String name=stu.getUsername();
String ide1=request.getParameter("1");
%>
<jsp:forward page="res.jsp">
    <jsp:param name="name" value="<%=name%>"/>
    <jsp:param name="ide" value="<%=ide1%>"/>
</jsp:forward>
<hr>

</body>
</html>
